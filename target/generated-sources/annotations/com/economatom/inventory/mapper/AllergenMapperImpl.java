package com.economatom.inventory.mapper;

import com.economatom.inventory.dto.request.AllergenRequestDTO;
import com.economatom.inventory.dto.response.AllergenResponseDTO;
import com.economatom.inventory.model.Allergen;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-01-30T21:47:22+0000",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.2 (GraalVM Community)"
)
@Component
public class AllergenMapperImpl implements AllergenMapper {

    @Override
    public AllergenResponseDTO toResponseDTO(Allergen allergen) {
        if ( allergen == null ) {
            return null;
        }

        AllergenResponseDTO allergenResponseDTO = new AllergenResponseDTO();

        allergenResponseDTO.setId( allergen.getId() );
        allergenResponseDTO.setName( allergen.getName() );

        return allergenResponseDTO;
    }

    @Override
    public Allergen toEntity(AllergenRequestDTO requestDTO) {
        if ( requestDTO == null ) {
            return null;
        }

        Allergen.AllergenBuilder allergen = Allergen.builder();

        allergen.name( requestDTO.getName() );

        return allergen.build();
    }

    @Override
    public void updateEntity(AllergenRequestDTO requestDTO, Allergen allergen) {
        if ( requestDTO == null ) {
            return;
        }

        if ( requestDTO.getName() != null ) {
            allergen.setName( requestDTO.getName() );
        }
    }
}
