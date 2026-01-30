package com.economatom.inventory.mapper;

import com.economatom.inventory.dto.request.UserRequestDTO;
import com.economatom.inventory.dto.response.UserResponseDTO;
import com.economatom.inventory.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface UserMapper {

    UserResponseDTO toResponseDTO(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "orders", ignore = true)
    @Mapping(target = "inventoryMovements", ignore = true)
    User toEntity(UserRequestDTO requestDTO);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "orders", ignore = true)
    @Mapping(target = "inventoryMovements", ignore = true)
    void updateEntity(UserRequestDTO requestDTO, @MappingTarget User user);
}
