package com.economatom.inventory.mapper;

import com.economatom.inventory.dto.response.RecipeComponentResponseDTO;
import com.economatom.inventory.model.Product;
import com.economatom.inventory.model.Recipe;
import com.economatom.inventory.model.RecipeComponent;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-01-30T21:47:22+0000",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.2 (GraalVM Community)"
)
@Component
public class RecipeComponentMapperImpl implements RecipeComponentMapper {

    @Override
    public RecipeComponentResponseDTO toResponseDTO(RecipeComponent component) {
        if ( component == null ) {
            return null;
        }

        RecipeComponentResponseDTO recipeComponentResponseDTO = new RecipeComponentResponseDTO();

        recipeComponentResponseDTO.setParentRecipeId( componentParentRecipeId( component ) );
        recipeComponentResponseDTO.setProductId( componentProductId( component ) );
        recipeComponentResponseDTO.setProductName( componentProductName( component ) );
        recipeComponentResponseDTO.setSubtotal( calculateSubtotal( component ) );
        recipeComponentResponseDTO.setId( component.getId() );
        recipeComponentResponseDTO.setQuantity( component.getQuantity() );

        return recipeComponentResponseDTO;
    }

    private Integer componentParentRecipeId(RecipeComponent recipeComponent) {
        if ( recipeComponent == null ) {
            return null;
        }
        Recipe parentRecipe = recipeComponent.getParentRecipe();
        if ( parentRecipe == null ) {
            return null;
        }
        Integer id = parentRecipe.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private Integer componentProductId(RecipeComponent recipeComponent) {
        if ( recipeComponent == null ) {
            return null;
        }
        Product product = recipeComponent.getProduct();
        if ( product == null ) {
            return null;
        }
        Integer id = product.getId();
        if ( id == null ) {
            return null;
        }
        return id;
    }

    private String componentProductName(RecipeComponent recipeComponent) {
        if ( recipeComponent == null ) {
            return null;
        }
        Product product = recipeComponent.getProduct();
        if ( product == null ) {
            return null;
        }
        String name = product.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }
}
