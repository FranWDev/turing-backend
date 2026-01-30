package com.economatom.inventory.mapper;

import com.economatom.inventory.dto.response.InventoryMovementResponseDTO;
import com.economatom.inventory.model.InventoryAudit;
import com.economatom.inventory.model.Product;
import com.economatom.inventory.model.User;
import java.math.BigDecimal;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-01-30T21:47:22+0000",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.2 (GraalVM Community)"
)
@Component
public class InventoryMovementMapperImpl implements InventoryMovementMapper {

    @Override
    public InventoryMovementResponseDTO toResponseDTO(InventoryAudit audit, BigDecimal previousStock) {
        if ( audit == null && previousStock == null ) {
            return null;
        }

        InventoryMovementResponseDTO inventoryMovementResponseDTO = new InventoryMovementResponseDTO();

        if ( audit != null ) {
            inventoryMovementResponseDTO.setId( audit.getId() );
            inventoryMovementResponseDTO.setProductId( auditProductId( audit ) );
            inventoryMovementResponseDTO.setProductName( auditProductName( audit ) );
            inventoryMovementResponseDTO.setUserId( auditUsersId( audit ) );
            inventoryMovementResponseDTO.setUserName( auditUsersName( audit ) );
            inventoryMovementResponseDTO.setQuantity( audit.getQuantity() );
            inventoryMovementResponseDTO.setMovementType( audit.getMovementType() );
            inventoryMovementResponseDTO.setMovementDate( audit.getMovementDate() );
            inventoryMovementResponseDTO.setCurrentStock( auditProductCurrentStock( audit ) );
        }
        inventoryMovementResponseDTO.setPreviousStock( previousStock );

        return inventoryMovementResponseDTO;
    }

    @Override
    public InventoryMovementResponseDTO toResponseDTO(InventoryAudit audit) {
        if ( audit == null ) {
            return null;
        }

        InventoryMovementResponseDTO inventoryMovementResponseDTO = new InventoryMovementResponseDTO();

        inventoryMovementResponseDTO.setProductId( auditProductId( audit ) );
        inventoryMovementResponseDTO.setProductName( auditProductName( audit ) );
        inventoryMovementResponseDTO.setUserId( auditUsersId( audit ) );
        inventoryMovementResponseDTO.setUserName( auditUsersName( audit ) );
        inventoryMovementResponseDTO.setPreviousStock( auditProductCurrentStock( audit ) );
        inventoryMovementResponseDTO.setCurrentStock( auditProductCurrentStock( audit ) );
        inventoryMovementResponseDTO.setId( audit.getId() );
        inventoryMovementResponseDTO.setQuantity( audit.getQuantity() );
        inventoryMovementResponseDTO.setMovementType( audit.getMovementType() );
        inventoryMovementResponseDTO.setMovementDate( audit.getMovementDate() );

        return inventoryMovementResponseDTO;
    }

    private Integer auditProductId(InventoryAudit inventoryAudit) {
        if ( inventoryAudit == null ) {
            return null;
        }
        Product product = inventoryAudit.getProduct();
        if ( product == null ) {
            return null;
        }
        Integer id = product.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String auditProductName(InventoryAudit inventoryAudit) {
        if ( inventoryAudit == null ) {
            return null;
        }
        Product product = inventoryAudit.getProduct();
        if ( product == null ) {
            return null;
        }
        String name = product.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }

    private Integer auditUsersId(InventoryAudit inventoryAudit) {
        if ( inventoryAudit == null ) {
            return null;
        }
        User users = inventoryAudit.getUsers();
        if ( users == null ) {
            return null;
        }
        Integer id = users.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String auditUsersName(InventoryAudit inventoryAudit) {
        if ( inventoryAudit == null ) {
            return null;
        }
        User users = inventoryAudit.getUsers();
        if ( users == null ) {
            return null;
        }
        String name = users.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }

    private BigDecimal auditProductCurrentStock(InventoryAudit inventoryAudit) {
        if ( inventoryAudit == null ) {
            return null;
        }
        Product product = inventoryAudit.getProduct();
        if ( product == null ) {
            return null;
        }
        BigDecimal currentStock = product.getCurrentStock();
        if ( currentStock == null ) {
            return null;
        }
        return currentStock;
    }
}
