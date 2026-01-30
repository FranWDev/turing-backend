package com.economatom.inventory.mapper;

import com.economatom.inventory.dto.request.RecipeRequestDTO;
import com.economatom.inventory.dto.response.AllergenResponseDTO;
import com.economatom.inventory.dto.response.RecipeComponentResponseDTO;
import com.economatom.inventory.dto.response.RecipeResponseDTO;
import com.economatom.inventory.model.Allergen;
import com.economatom.inventory.model.Recipe;
import com.economatom.inventory.model.RecipeComponent;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import javax.annotation.processing.Generated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-01-30T21:47:22+0000",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.2 (GraalVM Community)"
)
@Component
public class RecipeMapperImpl implements RecipeMapper {

    @Autowired
    private RecipeComponentMapper recipeComponentMapper;
    @Autowired
    private AllergenMapper allergenMapper;

    @Override
    public RecipeResponseDTO toResponseDTO(Recipe recipe) {
        if ( recipe == null ) {
            return null;
        }

        RecipeResponseDTO recipeResponseDTO = new RecipeResponseDTO();

        recipeResponseDTO.setComponents( recipeComponentListToRecipeComponentResponseDTOList( recipe.getComponents() ) );
        recipeResponseDTO.setAllergens( allergenSetToAllergenResponseDTOList( recipe.getAllergens() ) );
        recipeResponseDTO.setTotalCost( calculateTotalCost( recipe ) );
        recipeResponseDTO.setId( recipe.getId() );
        recipeResponseDTO.setName( recipe.getName() );
        recipeResponseDTO.setElaboration( recipe.getElaboration() );
        recipeResponseDTO.setPresentation( recipe.getPresentation() );

        return recipeResponseDTO;
    }

    @Override
    public Recipe toEntity(RecipeRequestDTO requestDTO) {
        if ( requestDTO == null ) {
            return null;
        }

        Recipe.RecipeBuilder recipe = Recipe.builder();

        recipe.name( requestDTO.getName() );
        recipe.elaboration( requestDTO.getElaboration() );
        recipe.presentation( requestDTO.getPresentation() );

        return recipe.build();
    }

    @Override
    public void updateEntity(RecipeRequestDTO requestDTO, Recipe recipe) {
        if ( requestDTO == null ) {
            return;
        }

        if ( requestDTO.getName() != null ) {
            recipe.setName( requestDTO.getName() );
        }
        if ( requestDTO.getElaboration() != null ) {
            recipe.setElaboration( requestDTO.getElaboration() );
        }
        if ( requestDTO.getPresentation() != null ) {
            recipe.setPresentation( requestDTO.getPresentation() );
        }
    }

    protected List<RecipeComponentResponseDTO> recipeComponentListToRecipeComponentResponseDTOList(List<RecipeComponent> list) {
        if ( list == null ) {
            return null;
        }

        List<RecipeComponentResponseDTO> list1 = new ArrayList<RecipeComponentResponseDTO>( list.size() );
        for ( RecipeComponent recipeComponent : list ) {
            list1.add( recipeComponentMapper.toResponseDTO( recipeComponent ) );
        }

        return list1;
    }

    protected List<AllergenResponseDTO> allergenSetToAllergenResponseDTOList(Set<Allergen> set) {
        if ( set == null ) {
            return null;
        }

        List<AllergenResponseDTO> list = new ArrayList<AllergenResponseDTO>( set.size() );
        for ( Allergen allergen : set ) {
            list.add( allergenMapper.toResponseDTO( allergen ) );
        }

        return list;
    }
}
