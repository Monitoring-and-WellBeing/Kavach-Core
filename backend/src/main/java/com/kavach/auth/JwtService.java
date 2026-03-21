package com.kavach.auth;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${kavach.jwt.secret}")
    private String secret;

    @Value("${kavach.jwt.access-token-expiry}")
    private long accessTokenExpiry;

    /**
     * Fail fast at startup if JWT_SECRET is too short.
     * Silent key-padding was masking weak secrets — a security hole.
     * HS256 requires a minimum 256-bit (32-byte) key.
     */
    @PostConstruct
    void validateSecret() {
        if (secret == null || secret.getBytes().length < 32) {
            throw new IllegalStateException(
                "JWT_SECRET must be at least 32 characters (256 bits). " +
                "Current length: " + (secret == null ? 0 : secret.getBytes().length) + " bytes. " +
                "Set a strong JWT_SECRET environment variable before starting."
            );
        }
    }

    public String generateAccessToken(String email, String role, String userId, String tenantId) {
        return Jwts.builder()
                .setClaims(Map.of("role", role, "userId", userId, "tenantId", tenantId != null ? tenantId : ""))
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpiry))
                .signWith(getKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public String extractUserId(String token) {
        return extractAllClaims(token).get("userId", String.class);
    }

    public String extractTenantId(String token) {
        try {
            return extractAllClaims(token).get("tenantId", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(getKey()).build().parseClaimsJws(token).getBody();
    }

    private Key getKey() {
        // Secret is validated to be >= 32 bytes in @PostConstruct — no padding needed.
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
}
