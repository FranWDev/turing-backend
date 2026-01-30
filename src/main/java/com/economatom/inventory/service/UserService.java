package com.economatom.inventory.service;

import com.economatom.inventory.dto.request.UserRequestDTO;
import com.economatom.inventory.dto.response.UserResponseDTO;
import com.economatom.inventory.exception.InvalidOperationException;
import com.economatom.inventory.exception.ResourceNotFoundException;
import com.economatom.inventory.mapper.UserMapper;
import com.economatom.inventory.model.User;
import com.economatom.inventory.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(rollbackFor = {RuntimeException.class, Exception.class})
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder, UserMapper userMapper) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    // NO cachear listas paginadas (mejor cachear solo findById)
    @Transactional(readOnly = true)
    public List<UserResponseDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).stream()
                .map(userMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "user", key = "#id")
    @Transactional(readOnly = true)
    public Optional<UserResponseDTO> findById(Integer id) {
        return repository.findById(id)
                .map(userMapper::toResponseDTO);
    }

    @Cacheable(value = "userByEmail", key = "#username")
    @Transactional(readOnly = true)
    public User findByUsername(String username) {
        return repository.findByName(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @CacheEvict(value = {"users", "user", "userByEmail"}, allEntries = true)
    @Transactional(rollbackFor = {InvalidOperationException.class, RuntimeException.class, Exception.class})
    public UserResponseDTO save(UserRequestDTO requestDTO) {
        if (repository.existsByEmail(requestDTO.getEmail())) {
            throw new InvalidOperationException("Email already exists");
        }

        User user = userMapper.toEntity(requestDTO);
        user.setPassword(passwordEncoder.encode(requestDTO.getPassword()));
        
        // Establecer rol por defecto si no se proporciona
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("USER");
        }
        
        return userMapper.toResponseDTO(repository.save(user));
    }

    @CacheEvict(value = {"users", "user", "userByEmail"}, allEntries = true)
    @Transactional(rollbackFor = {InvalidOperationException.class, ResourceNotFoundException.class, RuntimeException.class, Exception.class})
    public Optional<UserResponseDTO> update(Integer id, UserRequestDTO requestDTO) {
        return repository.findById(id)
                .map(existing -> {
                    userMapper.updateEntity(requestDTO, existing);
                    if (requestDTO.getPassword() != null && !requestDTO.getPassword().isEmpty()) {
                        existing.setPassword(passwordEncoder.encode(requestDTO.getPassword()));
                    }
                    return userMapper.toResponseDTO(repository.save(existing));
                });
    }

    @CacheEvict(value = {"users", "user", "userByEmail"}, allEntries = true)
    @Transactional(rollbackFor = {InvalidOperationException.class, ResourceNotFoundException.class, RuntimeException.class, Exception.class})
    public void deleteById(Integer id) {
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> findByRole(String role) {
        return repository.findByRole(role).stream()
                .map(userMapper::toResponseDTO)
                .collect(Collectors.toList());
    }
}