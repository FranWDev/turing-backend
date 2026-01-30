package com.economatom.inventory.mapper;

import com.economatom.inventory.dto.response.RecipeAuditResponseDTO;
import com.economatom.inventory.model.RecipeAudit;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(
    componentModel = "spring",
    nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface RecipeAuditMapper {

    @Mapping(source = "recipe.id", target = "id_recipe")
    @Mapping(source = "users.id", target = "id_user")
    RecipeAuditResponseDTO toResponseDTO(RecipeAudit audit);
}
