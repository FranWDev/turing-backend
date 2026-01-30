package com.economatom.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "DTO de respuesta con los datos de un usuario")
public class UserResponseDTO {

    @Schema(description = "Identificador único del usuario", example = "1")
    private Integer id;

    @Schema(description = "Nombre completo del usuario", example = "Juan Pérez")
    private String name;

    @Schema(description = "Correo electrónico del usuario", example = "juan@example.com")
    private String email;

    @Schema(description = "Rol del usuario. Puede ser ADMIN, USER o CHEF", 
            allowableValues = {"ADMIN", "USER", "CHEF"}, 
            example = "USER")
    private String role;
}
