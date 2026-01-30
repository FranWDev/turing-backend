package com.economatom.inventory.repository;

import com.economatom.inventory.dto.response.ProductResponseDTO;
import com.economatom.inventory.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Integer> {

    boolean existsByName(String name);

    List<Product> findByType(String type);

    List<Product> findByNameContainingIgnoreCase(String namePart);

    List<Product> findByCurrentStockLessThan(BigDecimal stock);

    List<Product> findByUnitPriceBetween(BigDecimal min, BigDecimal max);

    Optional<Product> findByProductCode(String productCode);

    Optional<Product> findById(ProductResponseDTO product2);

    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdOptimized(@Param("id") Integer id);

    /**
     * Busca un producto con bloqueo pesimista de escritura.
     * Utiliza PESSIMISTIC_WRITE para prevenir lecturas y escrituras concurrentes
     * durante actualizaciones críticas de stock.
     * 
     * @param id ID del producto
     * @return Optional con el producto bloqueado
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Integer id);

    /**
     * Busca múltiples productos con bloqueo pesimista de escritura.
     * Útil para operaciones batch que actualizan varios productos.
     * 
     * @param ids Lista de IDs de productos
     * @return Lista de productos bloqueados
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id IN :ids")
    List<Product> findByIdsForUpdate(@Param("ids") List<Integer> ids);

    /**
     * Busca un producto con bloqueo pesimista de lectura.
     * Permite lecturas concurrentes pero previene escrituras.
     * Útil para cálculos que requieren consistencia pero no modifican datos.
     * 
     * @param id ID del producto
     * @return Optional con el producto
     */
    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForRead(@Param("id") Integer id);

}
