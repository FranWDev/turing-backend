package com.economatom.inventory.controller;

import com.economatom.inventory.dto.request.LoginRequestDTO;
import com.economatom.inventory.dto.request.UserRequestDTO;
import com.economatom.inventory.dto.response.LoginResponseDTO;
import com.economatom.inventory.dto.response.UserResponseDTO;
import com.economatom.inventory.model.User;
import com.economatom.inventory.repository.UserRepository;
import com.economatom.inventory.util.TestDataUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

class UserControllerIntegrationTest extends BaseIntegrationTest {

        private static final String BASE_URL = "/api/users";
        private static final String AUTH_URL = "/api/auth/login";

        @Autowired
        private UserRepository userRepository;

        private String jwtToken;
        private User testAdmin;

        @BeforeEach
        void setUp() throws Exception {
                userRepository.deleteAll();

                testAdmin = TestDataUtil.createAdminUser();
                userRepository.saveAndFlush(testAdmin);

                LoginRequestDTO loginRequest = new LoginRequestDTO();
                loginRequest.setName(testAdmin.getName());
                loginRequest.setPassword("admin123");

                String response = mockMvc.perform(post(AUTH_URL)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJsonString(loginRequest)))
                                .andExpect(status().isOk())
                                .andReturn().getResponse().getContentAsString();

                LoginResponseDTO loginResponse = objectMapper.readValue(response, LoginResponseDTO.class);
                jwtToken = loginResponse.getToken();
        }

        @Test
        void whenCreateUser_thenSuccess() throws Exception {
                UserRequestDTO userRequest = TestDataUtil.createUserRequestDTO();

                mockMvc.perform(post(BASE_URL)
                                .header("Authorization", "Bearer " + jwtToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJsonString(userRequest)))
                                .andDo(print())
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.email").value(userRequest.getEmail()))
                                .andExpect(jsonPath("$.name").value(userRequest.getName()))
                                .andExpect(jsonPath("$.role").value(userRequest.getRole()));
        }

        @Test
        void whenGetAllUsers_thenSuccess() throws Exception {
                mockMvc.perform(get(BASE_URL)
                                .header("Authorization", "Bearer " + jwtToken))
                                .andDo(print())
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$", notNullValue()))
                                .andExpect(jsonPath("$[*].email").exists())
                                .andExpect(jsonPath("$[*].name").exists())
                                .andExpect(jsonPath("$[*].role").exists());
        }

        @Test
        void whenGetUserById_thenSuccess() throws Exception {
                UserRequestDTO userRequest = TestDataUtil.createUserRequestDTO();

                String response = mockMvc.perform(post(BASE_URL)
                                .header("Authorization", "Bearer " + jwtToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJsonString(userRequest)))
                                .andExpect(status().isCreated())
                                .andReturn().getResponse().getContentAsString();

                UserResponseDTO createdUser = objectMapper.readValue(response, UserResponseDTO.class);

                mockMvc.perform(get(BASE_URL + "/{id}", createdUser.getId())
                                .header("Authorization", "Bearer " + jwtToken))
                                .andDo(print())
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.email").value(userRequest.getEmail()))
                                .andExpect(jsonPath("$.name").value(userRequest.getName()))
                                .andExpect(jsonPath("$.role").value(userRequest.getRole()));
        }

        @Test
        void whenUpdateUser_thenSuccess() throws Exception {
                UserRequestDTO userRequest = TestDataUtil.createUserRequestDTO();

                String response = mockMvc.perform(post(BASE_URL)
                                .header("Authorization", "Bearer " + jwtToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJsonString(userRequest)))
                                .andExpect(status().isCreated())
                                .andReturn().getResponse().getContentAsString();

                UserResponseDTO createdUser = objectMapper.readValue(response, UserResponseDTO.class);

                userRequest.setName(userRequest.getName() + " Actualizado");

                mockMvc.perform(put(BASE_URL + "/{id}", createdUser.getId())
                                .header("Authorization", "Bearer " + jwtToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJsonString(userRequest)))
                                .andDo(print())
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.name").value(userRequest.getName()));
        }

        @Test
        void whenDeleteUser_thenSuccess() throws Exception {
                UserRequestDTO userRequest = TestDataUtil.createUserRequestDTO();

                String response = mockMvc.perform(post(BASE_URL)
                                .header("Authorization", "Bearer " + jwtToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJsonString(userRequest)))
                                .andExpect(status().isCreated())
                                .andReturn().getResponse().getContentAsString();

                UserResponseDTO createdUser = objectMapper.readValue(response, UserResponseDTO.class);

                mockMvc.perform(delete(BASE_URL + "/{id}", createdUser.getId())
                                .header("Authorization", "Bearer " + jwtToken))
                                .andDo(print())
                                .andExpect(status().isNoContent());

                mockMvc.perform(get(BASE_URL + "/{id}", createdUser.getId())
                                .header("Authorization", "Bearer " + jwtToken))
                                .andDo(print())
                                .andExpect(status().isNotFound());
        }
}
