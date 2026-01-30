package com.economatom.inventory.mapper;

import com.economatom.inventory.dto.response.OrderDetailResponseDTO;
import com.economatom.inventory.model.Order;
import com.economatom.inventory.model.OrderDetail;
import com.economatom.inventory.model.Product;
import java.math.BigDecimal;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-01-30T21:47:22+0000",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.2 (GraalVM Community)"
)
@Component
public class OrderDetailMapperImpl implements OrderDetailMapper {

    @Override
    public OrderDetailResponseDTO toResponseDTO(OrderDetail orderDetail) {
        if ( orderDetail == null ) {
            return null;
        }

        OrderDetailResponseDTO orderDetailResponseDTO = new OrderDetailResponseDTO();

        orderDetailResponseDTO.setOrderId( orderDetailOrderId( orderDetail ) );
        orderDetailResponseDTO.setProductId( orderDetailProductId( orderDetail ) );
        orderDetailResponseDTO.setProductName( orderDetailProductName( orderDetail ) );
        orderDetailResponseDTO.setUnitPrice( orderDetailProductUnitPrice( orderDetail ) );
        orderDetailResponseDTO.setSubtotal( calculateSubtotal( orderDetail ) );
        orderDetailResponseDTO.setQuantity( orderDetail.getQuantity() );
        orderDetailResponseDTO.setQuantityReceived( orderDetail.getQuantityReceived() );

        return orderDetailResponseDTO;
    }

    private Integer orderDetailOrderId(OrderDetail orderDetail) {
        if ( orderDetail == null ) {
            return null;
        }
        Order order = orderDetail.getOrder();
        if ( order == null ) {
            return null;
        }
        Integer id = order.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private Integer orderDetailProductId(OrderDetail orderDetail) {
        if ( orderDetail == null ) {
            return null;
        }
        Product product = orderDetail.getProduct();
        if ( product == null ) {
            return null;
        }
        Integer id = product.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String orderDetailProductName(OrderDetail orderDetail) {
        if ( orderDetail == null ) {
            return null;
        }
        Product product = orderDetail.getProduct();
        if ( product == null ) {
            return null;
        }
        String name = product.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }

    private BigDecimal orderDetailProductUnitPrice(OrderDetail orderDetail) {
        if ( orderDetail == null ) {
            return null;
        }
        Product product = orderDetail.getProduct();
        if ( product == null ) {
            return null;
        }
        BigDecimal unitPrice = product.getUnitPrice();
        if ( unitPrice == null ) {
            return null;
        }
        return unitPrice;
    }
}
