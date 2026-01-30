package com.economatom.inventory.repository;

import com.economatom.inventory.model.Allergen;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AllergenRepository extends JpaRepository<Allergen, Integer> {

    List<Allergen> findByNameContainingIgnoreCase(String namePart);
    
}
