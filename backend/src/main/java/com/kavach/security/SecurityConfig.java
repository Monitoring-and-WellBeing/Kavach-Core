package com.kavach.security;

import com.kavach.auth.JwtFilter;
import com.kavach.config.RequestIdFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final RequestIdFilter requestIdFilter;

    /**
     * Comma-separated list of allowed CORS origins.
     * Set CORS_ORIGINS env var in Railway/Vercel to include your frontend domain.
     * Example: https://kavach.vercel.app,http://localhost:3000
     */
    @Value("${spring.security.cors.allowed-origins:http://localhost:3000,http://localhost:3001}")
    private String corsOriginsRaw;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .headers(headers -> headers
                        .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
                        .contentTypeOptions(HeadersConfigurer.ContentTypeOptionsConfig::disable)
                        .httpStrictTransportSecurity(hsts -> hsts
                                .maxAgeInSeconds(31536000)
                                .includeSubDomains(true))
                        .referrerPolicy(referrer -> referrer
                                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"))
                )
                .authorizeHttpRequests(auth -> auth
                        // Explicitly permit ALL OPTIONS preflight requests so Spring Security
                        // never blocks them before the CORS filter can respond.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/api/v1/auth/**",
                                "/api/v1/activity",
                                "/api/v1/subscriptions/plans",
                                "/api/v1/subscription/webhook",
                                "/api/v1/devices/generate-code",
                                "/api/v1/devices/check-linked",
                                "/api/v1/devices/*/heartbeat",
                                "/api/v1/blocking/rules/*/agent",
                                "/api/v1/blocking/violations",
                                "/api/v1/focus/agent/**",
                                // Enforcement engine endpoints (desktop + Android — no JWT)
                                "/api/v1/enforcement/events",
                                "/api/v1/enforcement/state/*",
                                "/api/v1/enforcement/version/*",
                                "/api/v1/enforcement/usage",
                                // Mobile agent endpoints (no JWT — device authenticates by deviceId)
                                "/api/v1/location/update",
                                "/api/v1/location/batch",
                                "/api/v1/location/geofences",
                                "/api/v1/location/geofence-event",
                                "/api/v1/activity/mobile-usage",
                                "/api/v1/health/time",
                                // Screenshot endpoints (desktop agent — no JWT)
                                "/api/v1/screenshots/upload",
                                "/api/v1/screenshots/settings/*/mark-notified",
                                "/api/v1/screenshots/settings/*",
                                // SSE endpoint for desktop agent (device-auth, no JWT)
                                "/api/v1/sse/device/**",
                                "/api/v1/sse/health",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/api-docs/**",
                                "/v3/api-docs/**",
                                "/actuator/health"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .addFilterBefore(requestIdFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        // Parse comma-separated origins from env var (trimmed, no blanks)
        List<String> allowedOrigins = Arrays.stream(corsOriginsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // Cache preflight for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
