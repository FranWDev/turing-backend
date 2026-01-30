package com.economatom.inventory.mapper;

import com.economatom.inventory.dto.response.RecipeAuditResponseDTO;
import com.economatom.inventory.model.Recipe;
import com.economatom.inventory.model.RecipeAudit;
import com.economatom.inventory.model.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-01-30T21:47:22+0000",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.2 (GraalVM Community)"
)
@Component
public class RecipeAuditMapperImpl implements RecipeAuditMapper {

    @Override
    public RecipeAuditResponseDTO toResponseDTO(RecipeAudit audit) {
        if ( audit == null ) {
            return null;
        }

        RecipeAuditResponseDTO recipeAuditResponseDTO = new RecipeAuditResponseDTO();

        recipeAuditResponseDTO.setId_recipe( auditRecipeId( audit ) );
        recipeAuditResponseDTO.setId_user( auditUsersId( audit ) );
        recipeAuditResponseDTO.setAction( audit.getAction() );
        recipeAuditResponseDTO.setDetails( audit.getDetails() );
        recipeAuditResponseDTO.setAuditDate( audit.getAuditDate() );

        return recipeAuditResponseDTO;
    }

    private Integer auditRecipeId(RecipeAudit recipeAudit) {
        if ( recipeAudit == null ) {
            return null;
        }
        Recipe recipe = recipeAudit.getRecipe();
        if ( recipe == null ) {
            return null;
        }
        Integer id = recipe.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private Integer auditUsersId(RecipeAudit recipeAudit) {
        if ( recipeAudit == null ) {
            return null;
        }
        User users = recipeAudit.getUsers();
        if ( users == null ) {
            return null;
        }
        Integer id = users.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }
}
