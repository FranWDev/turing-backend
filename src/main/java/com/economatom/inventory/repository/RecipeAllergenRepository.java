package com.economatom.inventory.repository;

import com.economatom.inventory.model.Recipe;
import com.economatom.inventory.model.Allergen;
import com.economatom.inventory.model.RecipeAllergen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecipeAllergenRepository extends JpaRepository<RecipeAllergen, Integer> {
    List<RecipeAllergen> findByRecipe(Recipe recipe);
    List<RecipeAllergen> findByAllergen(Allergen allergen);
    List<RecipeAllergen> findByRecipeAndAllergen(Recipe recipe, Allergen allergen);
}