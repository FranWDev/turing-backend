package com.economatom.inventory.service;

import com.economatom.inventory.dto.response.RecipeResponseDTO;
import com.economatom.inventory.dto.response.UserResponseDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * Servicio de precarga de caché para evitar cold starts.
 * 
 * Se ejecuta al iniciar la aplicación y pre-carga en Redis:
 * - Productos más consultados (primera página)
 * - Recetas populares (primera página)
 * - Usuarios activos (primera página)
 * 
 * Esto garantiza que las primeras peticiones ya encuentren datos en caché,
 * evitando latencia inicial y mejorando la experiencia del usuario.
 */
@Slf4j
@Component
@Profile("!test") // No ejecutar en tests
@RequiredArgsConstructor
public class CacheWarmupService implements CommandLineRunner {

    private final ProductService productService;
    private final RecipeService recipeService;
    private final UserService userService;

    @Override
    public void run(String... args) throws Exception {
        log.info("Iniciando warmup de caché...");
        long startTime = System.currentTimeMillis();

        try {
            // Ejecutar warmup en paralelo para ser más rápido
            CompletableFuture<Void> productsWarmup = CompletableFuture.runAsync(this::warmupProducts);
            CompletableFuture<Void> recipesWarmup = CompletableFuture.runAsync(this::warmupRecipes);
            CompletableFuture<Void> usersWarmup = CompletableFuture.runAsync(this::warmupUsers);

            // Esperar a que todos terminen (timeout de 30 segundos)
            CompletableFuture.allOf(productsWarmup, recipesWarmup, usersWarmup)
                    .get(30, TimeUnit.SECONDS);

            long duration = System.currentTimeMillis() - startTime;
            log.info("Warmup de caché completado en {}ms", duration);
            log.info("Sistema listo para recibir peticiones con caché pre-cargado");

        } catch (Exception e) {
            log.warn("Error durante warmup de caché (no crítico): {}", e.getMessage());
            log.info("Sistema continuará con caché vacío (se llenará con las primeras peticiones)");
        }
    }

    /**
     * Pre-carga productos en caché (primeras 2 páginas).
     */
    private void warmupProducts() {
        try {
            log.info("Pre-cargando productos...");
            
            // Cargar primera página (más consultada)
            Pageable page1 = PageRequest.of(0, 10);
            productService.findAll(page1);
            
            // Cargar segunda página
            Pageable page2 = PageRequest.of(1, 10);
            productService.findAll(page2);
            
            log.info("Productos pre-cargados (2 páginas, 20 items)");
        } catch (Exception e) {
            log.warn("Error pre-cargando productos: {}", e.getMessage());
        }
    }

    /**
     * Pre-carga recetas en caché (primeras 2 páginas).
     */
    private void warmupRecipes() {
        try {
            log.info("Pre-cargando recetas...");
            
            // Cargar primera página
            Pageable page1 = PageRequest.of(0, 10);
            List<RecipeResponseDTO> recipes1 = recipeService.findAll(page1);
            
            // Cargar segunda página
            Pageable page2 = PageRequest.of(1, 10);
            recipeService.findAll(page2);
            
            // Pre-cargar detalles de las primeras 5 recetas (más consultadas)
            recipes1.stream()
                    .limit(5)
                    .forEach(recipe -> {
                        try {
                            recipeService.findById(recipe.getId());
                        } catch (Exception e) {
                            // Ignorar errores individuales
                        }
                    });
            
            log.info("Recetas pre-cargadas (2 páginas + 5 detalles)");
        } catch (Exception e) {
            log.warn("Error pre-cargando recetas: {}", e.getMessage());
        }
    }

    /**
     * Pre-carga usuarios en caché (primera página).
     */
    private void warmupUsers() {
        try {
            log.info("Pre-cargando usuarios...");
            
            // Cargar primera página
            Pageable page1 = PageRequest.of(0, 10);
            List<UserResponseDTO> users = userService.findAll(page1);
            
            // Pre-cargar detalles de los primeros 3 usuarios (admin y usuarios frecuentes)
            users.stream()
                    .limit(3)
                    .forEach(user -> {
                        try {
                            userService.findById(user.getId());
                        } catch (Exception e) {
                            // Ignorar errores individuales
                        }
                    });
            
            log.info("Usuarios pre-cargados (1 página + 3 detalles)");
        } catch (Exception e) {
            log.warn("Error pre-cargando usuarios: {}", e.getMessage());
        }
    }
}
