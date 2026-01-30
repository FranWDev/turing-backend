package com.economatom.inventory.service;

import com.economatom.inventory.dto.request.AllergenRequestDTO;
import com.economatom.inventory.dto.response.AllergenResponseDTO;
import com.economatom.inventory.exception.InvalidOperationException;
import com.economatom.inventory.exception.ResourceNotFoundException;
import com.economatom.inventory.mapper.AllergenMapper;
import com.economatom.inventory.model.Allergen;
import com.economatom.inventory.repository.AllergenRepository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@Transactional(rollbackFor = {InvalidOperationException.class, ResourceNotFoundException.class, RuntimeException.class, Exception.class})
public class AllergenService {

    private final AllergenRepository repository;
    private final AllergenMapper allergenMapper;

    public AllergenService(AllergenRepository repository, AllergenMapper allergenMapper) {
        this.repository = repository;
        this.allergenMapper = allergenMapper;
    }

    @Transactional(readOnly = true)
    public Page<AllergenResponseDTO> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(allergenMapper::toResponseDTO);
    }

    @Transactional(readOnly = true)
    public Optional<AllergenResponseDTO> findById(Integer id) {
        return repository.findById(id)
                .map(allergenMapper::toResponseDTO);
    }

    @Transactional(rollbackFor = {InvalidOperationException.class, RuntimeException.class, Exception.class})
    public AllergenResponseDTO save(AllergenRequestDTO requestDTO) {
        Allergen allergen = allergenMapper.toEntity(requestDTO);
        return allergenMapper.toResponseDTO(repository.save(allergen));
    }

    @Transactional(rollbackFor = {InvalidOperationException.class, ResourceNotFoundException.class, RuntimeException.class, Exception.class})
    public Optional<AllergenResponseDTO> update(Integer id, AllergenRequestDTO requestDTO) {
        return repository.findById(id)
                .map(existing -> {
                    allergenMapper.updateEntity(requestDTO, existing);
                    return allergenMapper.toResponseDTO(repository.save(existing));
                });
    }

    @Transactional(rollbackFor = {InvalidOperationException.class, ResourceNotFoundException.class, RuntimeException.class, Exception.class})
    public void deleteById(Integer id) {
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Optional<AllergenResponseDTO> findByName(String namePart) {
        return repository.findByNameContainingIgnoreCase(namePart).stream()
                .findFirst()
                .map(allergenMapper::toResponseDTO);
    }
}
