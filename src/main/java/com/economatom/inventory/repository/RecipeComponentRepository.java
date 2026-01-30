package com.economatom.inventory.repository;

import com.economatom.inventory.model.RecipeComponent;
import com.economatom.inventory.model.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecipeComponentRepository extends JpaRepository<RecipeComponent, Integer> {

    boolean existsByProductId(Integer productId);

    List<RecipeComponent> findByParentRecipe(Recipe parentRecipe);
    
    @Query("SELECT rc FROM RecipeComponent rc WHERE rc.product.type = :productType")
    List<RecipeComponent> findByProductType(@Param("productType") String productType);
    
    @Query("SELECT c FROM RecipeComponent c " +
           "JOIN FETCH c.parentRecipe " +
           "JOIN FETCH c.product " +
           "WHERE c.id = :id")
    Optional<RecipeComponent> findWithRecipeAndProductById(@Param("id") Integer id);

    @Query("SELECT c FROM RecipeComponent c " +
           "JOIN FETCH c.parentRecipe " +
           "JOIN FETCH c.product " +
           "WHERE c.parentRecipe.id = :recipeId")
    List<RecipeComponent> findAllByRecipeIdWithRelations(@Param("recipeId") Integer recipeId);

}