package com.kavach.auth;

import com.kavach.auth.dto.*;
import com.kavach.auth.entity.RefreshToken;
import com.kavach.auth.repository.RefreshTokenRepository;
import com.kavach.tenants.Tenant;
import com.kavach.tenants.TenantRepository;
import com.kavach.users.Role;
import com.kavach.users.User;
import com.kavach.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final TenantRepository tenantRepo;
    private final RefreshTokenRepository refreshTokenRepo;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${kavach.jwt.refresh-token-expiry}")
    private long refreshTokenExpiry;

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new BadCredentialsException("Account is deactivated");
        }

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse signup(SignupRequest req) {
        if (userRepo.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Create tenant
        Tenant tenant = new Tenant();
        tenant.setName(req.getInstituteName());
        tenant.setType(req.getInstituteType());
        tenant.setCity(req.getCity());
        tenant.setState(req.getState());
        tenant.setAdminEmail(req.getEmail());
        tenant.setCreatedAt(Instant.now());
        tenant = tenantRepo.save(tenant);

        // Create user
        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setPhone(req.getPhone());
        user.setRole(Role.INSTITUTE_ADMIN);
        user.setTenantId(tenant.getId());
        user.setEmailVerified(true); // skip email verification for MVP
        user.setActive(true);
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        user = userRepo.save(user);

        return buildAuthResponse(user);
    }

    @Transactional
    public AuthResponse refresh(RefreshRequest req) {
        RefreshToken stored = refreshTokenRepo.findByToken(req.getRefreshToken())
                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

        if (stored.isRevoked() || stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Refresh token expired or revoked");
        }

        stored.setRevoked(true);
        refreshTokenRepo.save(stored);

        return buildAuthResponse(stored.getUser());
    }

    @Transactional
    public void logout(String userEmail) {
        userRepo.findByEmail(userEmail).ifPresent(refreshTokenRepo::revokeAllUserTokens);
    }

    public AuthResponse.UserDto getCurrentUser(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return AuthResponse.UserDto.builder()
                .id(user.getId().toString())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .tenantId(user.getTenantId() != null ? user.getTenantId().toString() : "")
                .phone(user.getPhone())
                .build();
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId().toString(),
                user.getTenantId() != null ? user.getTenantId().toString() : ""
        );

        String rawRefreshToken = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(rawRefreshToken)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiry / 1000))
                .build();
        refreshTokenRepo.revokeAllUserTokens(user);
        refreshTokenRepo.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .expiresIn(900)
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId().toString())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole().name())
                        .tenantId(user.getTenantId() != null ? user.getTenantId().toString() : "")
                        .phone(user.getPhone())
                        .build())
                .build();
    }
}
