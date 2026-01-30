package com.economatom.inventory.mapper;

import com.economatom.inventory.dto.request.ProductRequestDTO;
import com.economatom.inventory.dto.response.ProductResponseDTO;
import com.economatom.inventory.model.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface ProductMapper {

    ProductResponseDTO toResponseDTO(Product product);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "orderDetails", ignore = true)
    Product toEntity(ProductRequestDTO requestDTO);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "orderDetails", ignore = true)
    void updateEntity(ProductRequestDTO requestDTO, @MappingTarget Product product);
}
