package com.economatom.inventory.mapper;

import com.economatom.inventory.dto.request.AllergenRequestDTO;
import com.economatom.inventory.dto.response.AllergenResponseDTO;
import com.economatom.inventory.model.Allergen;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface AllergenMapper {

    AllergenResponseDTO toResponseDTO(Allergen allergen);

    Allergen toEntity(AllergenRequestDTO requestDTO);

    void updateEntity(AllergenRequestDTO requestDTO, @MappingTarget Allergen allergen);
}
