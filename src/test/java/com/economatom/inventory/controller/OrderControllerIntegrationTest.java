package com.economatom.inventory.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.economatom.inventory.dto.request.LoginRequestDTO;
import com.economatom.inventory.dto.request.OrderRequestDTO;
import com.economatom.inventory.dto.request.OrderDetailRequestDTO;
import com.economatom.inventory.dto.response.LoginResponseDTO;
import com.economatom.inventory.model.User;
import com.economatom.inventory.model.Product;
import com.economatom.inventory.repository.UserRepository;
import com.economatom.inventory.repository.ProductRepository;
import com.economatom.inventory.util.TestDataUtil;

class OrderControllerIntegrationTest extends BaseIntegrationTest {

        private static final String BASE_URL = "/api/orders";
        private static final String AUTH_URL = "/api/auth/login";

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private ProductRepository productRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        private String jwtToken;
        private User testUser;
        private Product testProduct1;
        private Product testProduct2;

        @BeforeEach
        public void setUp() throws Exception {
                clearDatabase();

                // Crear y guardar usuario de prueba
                testUser = TestDataUtil.createChefUser();
                testUser.setPassword(passwordEncoder.encode("chef123")); // Aseguramos conocer la contraseña
                testUser = userRepository.saveAndFlush(testUser);

                // Crear y guardar productos de prueba
                testProduct1 = TestDataUtil.createFlour();
                testProduct1 = productRepository.saveAndFlush(testProduct1);

                testProduct2 = TestDataUtil.createSugar();
                testProduct2 = productRepository.saveAndFlush(testProduct2);

                // Obtener token JWT
                LoginRequestDTO loginRequest = new LoginRequestDTO();
                loginRequest.setName(testUser.getName());
                loginRequest.setPassword("chef123");

                String response = mockMvc.perform(post(AUTH_URL)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJsonString(loginRequest)))
                                .andExpect(status().isOk())
                                .andReturn().getResponse().getContentAsString();

                LoginResponseDTO loginResponse = objectMapper.readValue(response, LoginResponseDTO.class);
                jwtToken = loginResponse.getToken();
        }

        @Test
        void whenGetAllOrders_thenReturnsPaginatedOrders() throws Exception {
                mockMvc.perform(get(BASE_URL)
                                .header("Authorization", "Bearer " + jwtToken)
                                .param("page", "0")
                                .param("size", "10"))
                                .andExpect(status().isOk());
        }

        @Test
        void whenCreateValidOrder_thenReturnsCreatedOrder() throws Exception {
                // Crear orden con un detalle usando el producto de prueba
                OrderRequestDTO orderRequest = new OrderRequestDTO();
                orderRequest.setUserId(testUser.getId());

                List<OrderDetailRequestDTO> details = new ArrayList<>();
                OrderDetailRequestDTO detail = new OrderDetailRequestDTO();
                detail.setProductId(testProduct1.getId());
                detail.setQuantity(new BigDecimal("2.5"));
                details.add(detail);
                orderRequest.setDetails(details);

                mockMvc.perform(post(BASE_URL)
                                .header("Authorization", "Bearer " + jwtToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJsonString(orderRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.userId", is(testUser.getId())))
                                .andExpect(jsonPath("$.details", hasSize(1)))
                                .andExpect(jsonPath("$.details[0].productId", is(testProduct1.getId())))
                                .andExpect(jsonPath("$.details[0].quantity", is(2.5)));
        }

        @Test
        void whenGetOrderById_thenReturnsOrder() throws Exception {
                // Primero creamos una orden
                OrderRequestDTO orderRequest = new OrderRequestDTO();
                orderRequest.setUserId(testUser.getId());

                List<OrderDetailRequestDTO> details = new ArrayList<>();
                OrderDetailRequestDTO detail = new OrderDetailRequestDTO();
                detail.setProductId(testProduct1.getId());
                detail.setQuantity(new BigDecimal("2.5"));
                details.add(detail);
                orderRequest.setDetails(details);

                String response = mockMvc.perform(post(BASE_URL)
                                .header("Authorization", "Bearer " + jwtToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJsonString(orderRequest)))
                                .andExpect(status().isOk())
                                .andReturn().getResponse().getContentAsString();

                Integer orderId = objectMapper.readTree(response).get("id").asInt();

                // Luego la recuperamos por ID
                mockMvc.perform(get(BASE_URL + "/{id}", orderId)
                                .header("Authorization", "Bearer " + jwtToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.userId", is(testUser.getId())))
                                .andExpect(jsonPath("$.details[0].productId", is(testProduct1.getId())))
                                .andExpect(jsonPath("$.details[0].quantity", is(2.5)));
        }

        @Test
        void whenUpdateOrder_thenReturnsUpdatedOrder() throws Exception {
                // Crear orden inicial
                OrderRequestDTO orderRequest = new OrderRequestDTO();
                orderRequest.setUserId(testUser.getId());

                List<OrderDetailRequestDTO> details = new ArrayList<>();
                OrderDetailRequestDTO detail = new OrderDetailRequestDTO();
                detail.setProductId(testProduct1.getId());
                detail.setQuantity(new BigDecimal("2.5"));
                details.add(detail);
                orderRequest.setDetails(details);

                String response = mockMvc.perform(post(BASE_URL)
                                .header("Authorization", "Bearer " + jwtToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJsonString(orderRequest)))
                                .andExpect(status().isOk())
                                .andReturn().getResponse().getContentAsString();

                Integer orderId = objectMapper.readTree(response).get("id").asInt();

                // Actualizar orden con nuevos detalles
                List<OrderDetailRequestDTO> updatedDetails = new ArrayList<>();
                OrderDetailRequestDTO updatedDetail = new OrderDetailRequestDTO();
                updatedDetail.setProductId(testProduct2.getId());
                updatedDetail.setQuantity(new BigDecimal("3.0"));
                updatedDetails.add(updatedDetail);
                orderRequest.setDetails(updatedDetails);

                mockMvc.perform(put(BASE_URL + "/{id}", orderId)
                                .header("Authorization", "Bearer " + jwtToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJsonString(orderRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.userId", is(testUser.getId())))
                                .andExpect(jsonPath("$.details[0].productId", is(testProduct2.getId())))
                                .andExpect(jsonPath("$.details[0].quantity", is(3.0)));
        }

        @Test
        void whenDeleteOrder_thenReturnsNoContent() throws Exception {
                // Crear orden inicial
                OrderRequestDTO orderRequest = new OrderRequestDTO();
                orderRequest.setUserId(testUser.getId());

                List<OrderDetailRequestDTO> details = new ArrayList<>();
                OrderDetailRequestDTO detail = new OrderDetailRequestDTO();
                detail.setProductId(testProduct1.getId());
                detail.setQuantity(new BigDecimal("2.5"));
                details.add(detail);
                orderRequest.setDetails(details);

                String response = mockMvc.perform(post(BASE_URL)
                                .header("Authorization", "Bearer " + jwtToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(asJsonString(orderRequest)))
                                .andExpect(status().isOk())
                                .andReturn().getResponse().getContentAsString();

                Integer orderId = objectMapper.readTree(response).get("id").asInt();

                // Eliminar la orden
                mockMvc.perform(delete(BASE_URL + "/{id}", orderId)
                                .header("Authorization", "Bearer " + jwtToken))
                                .andExpect(status().isNoContent());

                // Verificar que ya no existe
                mockMvc.perform(get(BASE_URL + "/{id}", orderId)
                                .header("Authorization", "Bearer " + jwtToken))
                                .andExpect(status().isNotFound());
        }
}