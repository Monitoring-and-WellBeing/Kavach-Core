package com.kavach.auth;

import com.kavach.users.User;
import com.kavach.users.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String jwtToken = jwtService.generateToken(user);

        return new AuthResponse(
                jwtToken,
                UUID.randomUUID().toString(), // mock refresh token
                user.getRole().name(),
                user.getId().toString(),
                user.getTenantId() != null ? user.getTenantId().toString() : null,
                user.getName()
        );
    }

    public AuthResponse register(RegisterRequest request) {
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setPhone(request.getPhone());
        user.setCreatedAt(Instant.now());

        userRepository.save(user);

        String jwtToken = jwtService.generateToken(user);

        return new AuthResponse(
                jwtToken,
                UUID.randomUUID().toString(),
                user.getRole().name(),
                user.getId().toString(),
                null,
                user.getName()
        );
    }
}
