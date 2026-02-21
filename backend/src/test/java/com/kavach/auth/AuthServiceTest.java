package com.kavach.auth;

import com.kavach.auth.dto.LoginRequest;
import com.kavach.auth.entity.RefreshToken;
import com.kavach.auth.repository.RefreshTokenRepository;
import com.kavach.tenants.TenantRepository;
import com.kavach.users.Role;
import com.kavach.users.User;
import com.kavach.users.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Feature 01 — Auth Service")
class AuthServiceTest {

    @Mock UserRepository userRepo;
    @Mock TenantRepository tenantRepo;
    @Mock RefreshTokenRepository refreshTokenRepo;
    @Mock JwtService jwtService;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks AuthService authService;

    private User mockUser;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        mockUser.setEmail("parent@demo.com");
        mockUser.setPasswordHash("$2a$10$encoded");
        mockUser.setRole(Role.PARENT);
        mockUser.setTenantId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        mockUser.setActive(true);
        mockUser.setName("Test User");
        mockUser.setCreatedAt(Instant.now());
        mockUser.setUpdatedAt(Instant.now());
    }

    @Test
    @DisplayName("login() returns tokens for valid credentials")
    void login_validCredentials_returnsTokens() {
        when(userRepo.findByEmail("parent@demo.com")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("demo123", mockUser.getPasswordHash())).thenReturn(true);
        when(jwtService.generateAccessToken(anyString(), anyString(), anyString(), anyString()))
            .thenReturn("mock.access.token");
        when(refreshTokenRepo.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        LoginRequest req = new LoginRequest();
        req.setEmail("parent@demo.com");
        req.setPassword("demo123");
        AuthResponse response = authService.login(req);

        assertThat(response).isNotNull();
        assertThat(response.getAccessToken()).isNotBlank();
        assertThat(response.getRefreshToken()).isNotBlank();
        assertThat(response.getUser().getEmail()).isEqualTo("parent@demo.com");
        verify(userRepo).findByEmail("parent@demo.com");
        verify(passwordEncoder).matches("demo123", mockUser.getPasswordHash());
    }

    @Test
    @DisplayName("login() throws exception for unknown email")
    void login_unknownEmail_throwsException() {
        when(userRepo.findByEmail("unknown@email.com")).thenReturn(Optional.empty());

        LoginRequest req = new LoginRequest();
        req.setEmail("unknown@email.com");
        req.setPassword("pass");
        assertThatThrownBy(() ->
            authService.login(req)
        ).isInstanceOf(org.springframework.security.authentication.BadCredentialsException.class)
         .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("login() throws exception for wrong password")
    void login_wrongPassword_throwsException() {
        when(userRepo.findByEmail("parent@demo.com")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("wrongpass", mockUser.getPasswordHash())).thenReturn(false);

        LoginRequest req = new LoginRequest();
        req.setEmail("parent@demo.com");
        req.setPassword("wrongpass");
        assertThatThrownBy(() ->
            authService.login(req)
        ).isInstanceOf(org.springframework.security.authentication.BadCredentialsException.class)
         .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("login() throws exception for inactive user")
    void login_inactiveUser_throwsException() {
        mockUser.setActive(false);
        when(userRepo.findByEmail("parent@demo.com")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("demo123", mockUser.getPasswordHash())).thenReturn(true);

        LoginRequest req = new LoginRequest();
        req.setEmail("parent@demo.com");
        req.setPassword("demo123");
        assertThatThrownBy(() ->
            authService.login(req)
        ).isInstanceOf(org.springframework.security.authentication.BadCredentialsException.class)
         .hasMessageContaining("Account is deactivated");
    }
}
