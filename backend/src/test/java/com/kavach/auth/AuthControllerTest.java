package com.kavach.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kavach.auth.dto.LoginRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Feature 01 — Auth Controller")
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean AuthService authService;

    @Test
    @DisplayName("POST /auth/login returns 200 with tokens")
    void login_returns200WithTokens() throws Exception {
        AuthResponse mockResponse = AuthResponse.builder()
            .accessToken("mock.access.token")
            .refreshToken("mock.refresh.token")
            .expiresIn(900)
            .build();

        when(authService.login(any())).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    createLoginRequest("parent@demo.com", "demo123"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").value("mock.access.token"))
            .andExpect(jsonPath("$.refreshToken").value("mock.refresh.token"));
    }

    @Test
    @DisplayName("POST /auth/login returns 401 for bad credentials")
    void login_returns401ForBadCredentials() throws Exception {
        when(authService.login(any())).thenThrow(
            new org.springframework.security.authentication.BadCredentialsException("Invalid credentials"));

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                    createLoginRequest("wrong@email.com", "bad"))))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /auth/login returns 400 for missing email")
    void login_returns400ForMissingEmail() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"password\":\"demo123\"}"))
            .andExpect(status().isBadRequest());
    }

    private LoginRequest createLoginRequest(String email, String password) {
        LoginRequest req = new LoginRequest();
        req.setEmail(email);
        req.setPassword(password);
        return req;
    }
}
