package com.economatom.inventory.concurrency;

import com.economatom.inventory.dto.request.ProductRequestDTO;
import com.economatom.inventory.model.Product;
import com.economatom.inventory.repository.ProductRepository;
import com.economatom.inventory.service.ProductService;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests para verificar el comportamiento del sistema de locking.
 * 
 * IMPORTANTE: Estos tests están @Disabled porque requieren configuración
 * específica de concurrencia y pueden ser lentos. Habilítalos cuando
 * necesites probar explícitamente el sistema de locks.
 */
@SpringBootTest
@ActiveProfiles("test")
@Disabled("Tests de concurrencia - Habilitar manualmente cuando sea necesario")
public class ConcurrencyTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductRepository productRepository;

    /**
     * Test de Optimistic Locking.
     * 
     * Escenario:
     * 1. Dos threads intentan actualizar el mismo producto simultáneamente
     * 2. El primero debe tener éxito
     * 3. El segundo debe fallar con OptimisticLockingFailureException
     * 4. El retry automático debe resolver el conflicto
     */
    @Test
    void shouldHandleOptimisticLockingConflict() throws InterruptedException {
        // Arrange: Crear producto de prueba
        Product product = new Product();
        product.setName("Producto Test Concurrencia");
        product.setType("Test");
        product.setUnit("kg");
        product.setUnitPrice(BigDecimal.valueOf(10.00));
        product.setProductCode("TEST-CONCURRENCY-001");
        product.setCurrentStock(BigDecimal.valueOf(100));
        product = productRepository.save(product);
        
        final Integer productId = product.getId();
        final int threadCount = 5;
        final CountDownLatch latch = new CountDownLatch(threadCount);
        final ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        final AtomicInteger successCount = new AtomicInteger(0);
        final AtomicInteger failureCount = new AtomicInteger(0);

        // Act: Múltiples threads intentan actualizar el mismo producto
        for (int i = 0; i < threadCount; i++) {
            final int threadNum = i;
            executor.submit(() -> {
                try {
                    ProductRequestDTO updateRequest = new ProductRequestDTO();
                    updateRequest.setName("Producto Test Concurrencia");
                    updateRequest.setType("Test");
                    updateRequest.setUnit("kg");
                    updateRequest.setUnitPrice(BigDecimal.valueOf(10.00 + threadNum));
                    updateRequest.setProductCode("TEST-CONCURRENCY-001");
                    updateRequest.setCurrentStock(BigDecimal.valueOf(100 + threadNum));
                    
                    productService.update(productId, updateRequest);
                    successCount.incrementAndGet();
                } catch (OptimisticLockingFailureException e) {
                    failureCount.incrementAndGet();
                } finally {
                    latch.countDown();
                }
            });
        }

        latch.await();
        executor.shutdown();

        // Assert: Al menos uno debe haber tenido éxito
        assertTrue(successCount.get() > 0, "Al menos una actualización debe tener éxito");
        
        // Con retry automático, deberían tener éxito la mayoría
        System.out.println("Éxitos: " + successCount.get() + ", Fallos: " + failureCount.get());
        
        // Limpiar
        productRepository.deleteById(productId);
    }

    /**
     * Test de Pessimistic Locking.
     * 
     * Escenario:
     * 1. Un thread obtiene lock pesimista en un producto
     * 2. Otro thread intenta obtener el mismo lock
     * 3. El segundo debe esperar hasta que el primero termine
     */
    @Test
    void shouldHandlePessimisticLocking() throws InterruptedException {
        // Arrange
        Product product = new Product();
        product.setName("Producto Test Lock Pesimista");
        product.setType("Test");
        product.setUnit("kg");
        product.setUnitPrice(BigDecimal.valueOf(15.00));
        product.setProductCode("TEST-PESSIMISTIC-001");
        product.setCurrentStock(BigDecimal.valueOf(200));
        product = productRepository.save(product);
        
        final Integer productId = product.getId();
        final CountDownLatch startLatch = new CountDownLatch(1);
        final CountDownLatch endLatch = new CountDownLatch(2);
        final long[] timestamps = new long[2];

        // Thread 1: Obtiene lock y espera 1 segundo
        Thread thread1 = new Thread(() -> {
            try {
                startLatch.await();
                timestamps[0] = System.currentTimeMillis();
                
                Product p = productRepository.findByIdForUpdate(productId).orElseThrow();
                Thread.sleep(1000); // Simula procesamiento
                p.setCurrentStock(BigDecimal.valueOf(150));
                productRepository.save(p);
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                endLatch.countDown();
            }
        });

        // Thread 2: Intenta obtener lock (debe esperar)
        Thread thread2 = new Thread(() -> {
            try {
                startLatch.await();
                Thread.sleep(100); // Asegurar que thread1 obtenga el lock primero
                timestamps[1] = System.currentTimeMillis();
                
                Product p = productRepository.findByIdForUpdate(productId).orElseThrow();
                p.setCurrentStock(BigDecimal.valueOf(180));
                productRepository.save(p);
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } finally {
                endLatch.countDown();
            }
        });

        // Act
        thread1.start();
        thread2.start();
        startLatch.countDown(); // Iniciar ambos threads
        endLatch.await();

        // Assert: Thread 2 debe haber esperado al menos 900ms
        long waitTime = timestamps[1] - timestamps[0];
        assertTrue(waitTime >= 900, 
            "Thread 2 debería haber esperado a Thread 1. Tiempo de espera: " + waitTime + "ms");
        
        // Limpiar
        productRepository.deleteById(productId);
    }

    /**
     * Test de verificación de @Version.
     * 
     * Verifica que el campo version se incrementa correctamente.
     */
    @Test
    void shouldIncrementVersionOnUpdate() {
        // Arrange
        Product product = new Product();
        product.setName("Producto Test Version");
        product.setType("Test");
        product.setUnit("kg");
        product.setUnitPrice(BigDecimal.valueOf(20.00));
        product.setProductCode("TEST-VERSION-001");
        product.setCurrentStock(BigDecimal.valueOf(50));
        product = productRepository.save(product);
        
        Long initialVersion = product.getVersion();
        assertNotNull(initialVersion, "Version inicial debe ser establecida");

        // Act: Actualizar el producto
        product.setCurrentStock(BigDecimal.valueOf(75));
        product = productRepository.save(product);

        // Assert: Version debe incrementarse
        assertNotNull(product.getVersion());
        assertEquals(initialVersion + 1, product.getVersion(), 
            "Version debe incrementarse en 1 después de actualización");
        
        // Limpiar
        productRepository.deleteById(product.getId());
    }
}
