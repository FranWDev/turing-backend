package com.economatom.inventory.service;

import com.economatom.inventory.annotation.RecipeAuditable;
import com.economatom.inventory.dto.request.RecipeComponentRequestDTO;
import com.economatom.inventory.dto.request.RecipeRequestDTO;
import com.economatom.inventory.dto.response.RecipeResponseDTO;
import com.economatom.inventory.exception.InvalidOperationException;
import com.economatom.inventory.exception.ResourceNotFoundException;
import com.economatom.inventory.mapper.RecipeMapper;
import com.economatom.inventory.model.Product;
import com.economatom.inventory.model.Recipe;
import com.economatom.inventory.model.RecipeComponent;
import com.economatom.inventory.repository.AllergenRepository;
import com.economatom.inventory.repository.ProductRepository;
import com.economatom.inventory.repository.RecipeRepository;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional(rollbackFor = {InvalidOperationException.class, ResourceNotFoundException.class, RuntimeException.class, Exception.class})
public class RecipeService {

    private final RecipeRepository repository;
    private final ProductRepository productRepository;
    private final AllergenRepository allergenRepository;
    private final RecipeMapper recipeMapper;

    public RecipeService(RecipeRepository repository,
                         ProductRepository productRepository,
                         AllergenRepository allergenRepository,
                         RecipeMapper recipeMapper) {
        this.repository = repository;
        this.productRepository = productRepository;
        this.allergenRepository = allergenRepository;
        this.recipeMapper = recipeMapper;
    }

    @Transactional(readOnly = true)
    public List<RecipeResponseDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).stream()
                .map(recipeMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Cacheable(value = "recipe", key = "#id")
    @Transactional(readOnly = true)
    public Optional<RecipeResponseDTO> findById(Integer id) {
        return repository.findByIdWithDetails(id).map(recipeMapper::toResponseDTO);
    }

    @CacheEvict(value = {"recipes", "recipe"}, allEntries = true)
    @RecipeAuditable(action = "CREATE_RECIPE")
    @Transactional(rollbackFor = {InvalidOperationException.class, ResourceNotFoundException.class, RuntimeException.class, Exception.class})
    public RecipeResponseDTO save(RecipeRequestDTO requestDTO) {
        Recipe recipe = toEntity(requestDTO);
        calculateTotalCost(recipe);
        return recipeMapper.toResponseDTO(repository.save(recipe));
    }

    @CacheEvict(value = {"recipes", "recipe"}, allEntries = true)
    @RecipeAuditable(action = "UPDATE_RECIPE")
    @Transactional(rollbackFor = {InvalidOperationException.class, ResourceNotFoundException.class, RuntimeException.class, Exception.class})
    public Optional<RecipeResponseDTO> update(Integer id, RecipeRequestDTO requestDTO) {
        return repository.findById(id)
                .map(existing -> {
                    updateEntity(existing, requestDTO);
                    calculateTotalCost(existing);
                    return recipeMapper.toResponseDTO(repository.save(existing));
                });
    }

    @CacheEvict(value = {"recipes", "recipe"}, allEntries = true)
    @Transactional(rollbackFor = {InvalidOperationException.class, ResourceNotFoundException.class, RuntimeException.class, Exception.class})
    public void deleteById(Integer id) {
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<RecipeResponseDTO> findByNameContaining(String namePart) {
        return repository.findByNameContainingIgnoreCaseWithDetails(namePart).stream()
                .map(recipeMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RecipeResponseDTO> findByCostLessThan(BigDecimal maxCost) {
        return repository.findByTotalCostLessThanWithDetails(maxCost).stream()
                .map(recipeMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    private Recipe toEntity(RecipeRequestDTO requestDTO) {
        Recipe recipe = new Recipe();
        updateEntity(recipe, requestDTO);
        return recipe;
    }

private void updateEntity(Recipe recipe, RecipeRequestDTO requestDTO) {

    recipe.setName(requestDTO.getName());
    recipe.setElaboration(requestDTO.getElaboration());
    recipe.setPresentation(requestDTO.getPresentation());

    /*
     * UPDATE COMPONENTS - use iterator to safely remove during iteration
     */
    if (requestDTO.getComponents() != null && !requestDTO.getComponents().isEmpty()) {
        // Build map of product IDs from request
        var requestedProductIds = requestDTO.getComponents().stream()
                .map(RecipeComponentRequestDTO::getProductId)
                .collect(java.util.stream.Collectors.toSet());
        
        // Remove components not in the request using iterator
        recipe.getComponents().removeIf(existing -> 
            !requestedProductIds.contains(existing.getProduct().getId()));
        
        // Update or add components
        for (RecipeComponentRequestDTO componentDTO : requestDTO.getComponents()) {
            Product product = productRepository.findById(componentDTO.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
            
            // Find existing component with this product
            RecipeComponent existingComponent = recipe.getComponents().stream()
                    .filter(c -> c.getProduct().getId().equals(componentDTO.getProductId()))
                    .findFirst()
                    .orElse(null);
            
            if (existingComponent != null) {
                // Update existing component
                existingComponent.setQuantity(componentDTO.getQuantity());
            } else {
                // Add new component
                RecipeComponent newComponent = new RecipeComponent();
                newComponent.setProduct(product);
                newComponent.setQuantity(componentDTO.getQuantity());
                recipe.addComponent(newComponent);
            }
        }
    } else {
        // No components in request, clear all
        recipe.getComponents().clear();
    }

    /*
     * UPDATE ALLERGENS
     */
    if (requestDTO.getAllergenIds() != null && !requestDTO.getAllergenIds().isEmpty()) {
        recipe.setAllergens(new HashSet<>(allergenRepository.findAllById(requestDTO.getAllergenIds())));
    } else {
        recipe.getAllergens().clear();
    }
}


    private void calculateTotalCost(Recipe recipe) {
        BigDecimal totalCost = recipe.getComponents().stream()
                .map(component -> component.getQuantity().multiply(component.getProduct().getUnitPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, java.math.RoundingMode.HALF_UP);
        recipe.setTotalCost(totalCost);
    }
}
