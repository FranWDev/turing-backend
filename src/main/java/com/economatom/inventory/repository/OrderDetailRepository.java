package com.economatom.inventory.repository;

import com.economatom.inventory.model.OrderDetail;
import com.economatom.inventory.model.OrderDetailId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, OrderDetailId> {
    
    @Query("SELECT od FROM OrderDetail od WHERE od.id.orderId = :orderId")
    List<OrderDetail> findByOrderId(@Param("orderId") Integer orderId);
    
    @Query("SELECT od FROM OrderDetail od WHERE od.id.productId = :productId")
    List<OrderDetail> findByProductId(@Param("productId") Integer productId);
}
