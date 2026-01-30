package com.economatom.inventory.mapper;

import com.economatom.inventory.dto.request.UserRequestDTO;
import com.economatom.inventory.dto.response.UserResponseDTO;
import com.economatom.inventory.model.User;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-01-30T21:47:22+0000",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.2 (GraalVM Community)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public UserResponseDTO toResponseDTO(User user) {
        if ( user == null ) {
            return null;
        }

        UserResponseDTO userResponseDTO = new UserResponseDTO();

        userResponseDTO.setId( user.getId() );
        userResponseDTO.setName( user.getName() );
        userResponseDTO.setEmail( user.getEmail() );
        userResponseDTO.setRole( user.getRole() );

        return userResponseDTO;
    }

    @Override
    public User toEntity(UserRequestDTO requestDTO) {
        if ( requestDTO == null ) {
            return null;
        }

        User user = new User();

        user.setName( requestDTO.getName() );
        user.setEmail( requestDTO.getEmail() );
        user.setPassword( requestDTO.getPassword() );
        user.setRole( requestDTO.getRole() );

        return user;
    }

    @Override
    public void updateEntity(UserRequestDTO requestDTO, User user) {
        if ( requestDTO == null ) {
            return;
        }

        if ( requestDTO.getName() != null ) {
            user.setName( requestDTO.getName() );
        }
        if ( requestDTO.getEmail() != null ) {
            user.setEmail( requestDTO.getEmail() );
        }
        if ( requestDTO.getPassword() != null ) {
            user.setPassword( requestDTO.getPassword() );
        }
        if ( requestDTO.getRole() != null ) {
            user.setRole( requestDTO.getRole() );
        }
    }
}
