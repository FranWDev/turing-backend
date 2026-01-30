package com.economatom.inventory.mapper;

import com.economatom.inventory.dto.request.ProductRequestDTO;
import com.economatom.inventory.dto.response.ProductResponseDTO;
import com.economatom.inventory.model.Product;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-01-30T21:47:22+0000",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.2 (GraalVM Community)"
)
@Component
public class ProductMapperImpl implements ProductMapper {

    @Override
    public ProductResponseDTO toResponseDTO(Product product) {
        if ( product == null ) {
            return null;
        }

        ProductResponseDTO productResponseDTO = new ProductResponseDTO();

        productResponseDTO.setId( product.getId() );
        productResponseDTO.setName( product.getName() );
        productResponseDTO.setType( product.getType() );
        productResponseDTO.setUnit( product.getUnit() );
        productResponseDTO.setUnitPrice( product.getUnitPrice() );
        productResponseDTO.setProductCode( product.getProductCode() );
        productResponseDTO.setCurrentStock( product.getCurrentStock() );

        return productResponseDTO;
    }

    @Override
    public Product toEntity(ProductRequestDTO requestDTO) {
        if ( requestDTO == null ) {
            return null;
        }

        Product product = new Product();

        product.setName( requestDTO.getName() );
        product.setType( requestDTO.getType() );
        product.setUnit( requestDTO.getUnit() );
        product.setUnitPrice( requestDTO.getUnitPrice() );
        product.setProductCode( requestDTO.getProductCode() );
        product.setCurrentStock( requestDTO.getCurrentStock() );

        return product;
    }

    @Override
    public void updateEntity(ProductRequestDTO requestDTO, Product product) {
        if ( requestDTO == null ) {
            return;
        }

        if ( requestDTO.getName() != null ) {
            product.setName( requestDTO.getName() );
        }
        if ( requestDTO.getType() != null ) {
            product.setType( requestDTO.getType() );
        }
        if ( requestDTO.getUnit() != null ) {
            product.setUnit( requestDTO.getUnit() );
        }
        if ( requestDTO.getUnitPrice() != null ) {
            product.setUnitPrice( requestDTO.getUnitPrice() );
        }
        if ( requestDTO.getProductCode() != null ) {
            product.setProductCode( requestDTO.getProductCode() );
        }
        if ( requestDTO.getCurrentStock() != null ) {
            product.setCurrentStock( requestDTO.getCurrentStock() );
        }
    }
}
