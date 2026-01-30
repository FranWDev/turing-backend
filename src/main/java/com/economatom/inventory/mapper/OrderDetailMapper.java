package com.economatom.inventory.mapper;

import com.economatom.inventory.dto.response.OrderDetailResponseDTO;
import com.economatom.inventory.model.OrderDetail;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.NullValuePropertyMappingStrategy;

import java.math.BigDecimal;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface OrderDetailMapper {

    @Mapping(source = "order.id", target = "orderId")
    @Mapping(source = "product.id", target = "productId")
    @Mapping(source = "product.name", target = "productName")
    @Mapping(source = "product.unitPrice", target = "unitPrice")
    @Mapping(source = ".", target = "subtotal", qualifiedByName = "calculateSubtotal")
    OrderDetailResponseDTO toResponseDTO(OrderDetail orderDetail);

    @Named("calculateSubtotal")
    default BigDecimal calculateSubtotal(OrderDetail orderDetail) {
        if (orderDetail.getQuantity() == null || orderDetail.getProduct() == null ||
                orderDetail.getProduct().getUnitPrice() == null) {
            return BigDecimal.ZERO;
        }
        return orderDetail.getQuantity().multiply(orderDetail.getProduct().getUnitPrice());
    }
}
