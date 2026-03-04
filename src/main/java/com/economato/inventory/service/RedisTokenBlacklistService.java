package com.economato.inventory.service;

import com.github.benmanes.caffeine.cache.Cache;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.economato.inventory.model.RevokedToken;
import com.economato.inventory.repository.RevokedTokenRepository;

import java.time.Duration;
import java.util.Date;
import java.util.Locale;

/**
 * Token blacklist service that uses Redis as primary cache with automatic fallback to database.
 * 
 * When Redis is available: Stores tokens in Redis with TTL
 * When Redis fails: Falls back to checking the database
 * 
 * This prevents 401 errors when Redis circuit breaker is open.
 */
@Slf4j
@Service
@Profile("!test")
public class RedisTokenBlacklistService implements TokenBlacklistService {

    private final RedisTemplate<String, String> redisTemplate;
    private final RevokedTokenRepository revokedTokenRepository;
    private final Cache<String, Locale> tokenLocaleCache;
    private static final String BLACKLIST_PREFIX = "token_blacklist:";

    public RedisTokenBlacklistService(RedisTemplate<String, String> redisTemplate,
            RevokedTokenRepository revokedTokenRepository,
            Cache<String, Locale> tokenLocaleCache) {
        this.redisTemplate = redisTemplate;
        this.revokedTokenRepository = revokedTokenRepository;
        this.tokenLocaleCache = tokenLocaleCache;
    }

    @Override
    public void blacklistToken(String token, Date expirationDate) {
        if (token != null && !token.isEmpty() && expirationDate != null) {
            try {
                // Try to save to Redis with TTL
                long ttlMillis = expirationDate.getTime() - System.currentTimeMillis();
                if (ttlMillis > 0) {
                    redisTemplate.opsForValue().set(
                            BLACKLIST_PREFIX + token,
                            "revoked",
                            Duration.ofMillis(ttlMillis));
                }
            } catch (Exception e) {
                // Redis failed, log warning but continue
                log.warn("Failed to blacklist token in Redis, falling back to database: {}", e.getMessage());
            }

            // Always save to database as backup
            try {
                revokedTokenRepository.save(new RevokedToken(token, expirationDate));
            } catch (Exception e) {
                log.error("Failed to blacklist token in database: {}", e.getMessage());
                throw new RuntimeException("Unable to revoke token", e);
            }

            // Invalidate locale cache
            tokenLocaleCache.invalidate(token);
        }
    }

    @Override
    public boolean isBlacklisted(String token) {
        if (token == null || token.isEmpty()) {
            return false;
        }

        try {
            // Try Redis first (faster)
            Boolean exists = redisTemplate.hasKey(BLACKLIST_PREFIX + token);
            if (exists != null && exists) {
                return true;
            }
        } catch (Exception e) {
            // Redis failed or circuit breaker is open
            log.debug("Redis unavailable for token lookup, falling back to database: {}", e.getMessage());
            // Continue to database fallback below
        }

        // Fallback to database if Redis fails or token not found in Redis
        try {
            return revokedTokenRepository.existsByToken(token);
        } catch (Exception e) {
            log.error("Failed to check token blacklist in database: {}", e.getMessage());
            // In case of database errors too, DENY access (fail secure)
            // This is safer than allowing unknown tokens through
            log.warn("Both Redis and Database failed for token check. Denying access for token to be safe.");
            return true;
        }
    }

    @Override
    public void clearBlacklist() {
        try {
            var keys = redisTemplate.keys(BLACKLIST_PREFIX + "*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            log.warn("Failed to clear Redis blacklist: {}", e.getMessage());
        }

        try {
            revokedTokenRepository.deleteAll();
        } catch (Exception e) {
            log.error("Failed to clear database blacklist: {}", e.getMessage());
        }
    }

    @Override
    public int getBlacklistSize() {
        try {
            var keys = redisTemplate.keys(BLACKLIST_PREFIX + "*");
            if (keys != null && !keys.isEmpty()) {
                return keys.size();
            }
        } catch (Exception e) {
            log.debug("Failed to get Redis blacklist size: {}", e.getMessage());
        }

        try {
            return (int) revokedTokenRepository.count();
        } catch (Exception e) {
            log.error("Failed to get database blacklist size: {}", e.getMessage());
            return 0;
        }
    }

    @Override
    public void cleanExpiredTokens() {
        try {
            // Redis manages TTL automatically
            // Clean database of expired tokens
            int deletedCount = revokedTokenRepository.deleteExpiredTokens(new Date());
            if (deletedCount > 0) {
                log.debug("Cleaned {} expired tokens from database", deletedCount);
            }
        } catch (Exception e) {
            log.error("Failed to clean expired tokens: {}", e.getMessage());
        }
    }
}

