package com.kavach.config;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithSecurityContext;
import org.springframework.security.test.context.support.WithSecurityContextFactory;

import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.util.List;

/**
 * Test configuration to support @WithMockEmail annotation
 * which sets the email as a String principal (matching JwtFilter behavior)
 */
@TestConfiguration
public class TestSecurityConfig {

    @Retention(RetentionPolicy.RUNTIME)
    @WithSecurityContext(factory = WithMockEmailSecurityContextFactory.class)
    public @interface WithMockEmail {
        String value();
        String[] roles() default {};
    }

    public static class WithMockEmailSecurityContextFactory implements WithSecurityContextFactory<WithMockEmail> {
        @Override
        public SecurityContext createSecurityContext(WithMockEmail annotation) {
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            String email = annotation.value();
            String[] roles = annotation.roles();
            
            List<SimpleGrantedAuthority> authorities = java.util.Arrays.stream(roles)
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(java.util.stream.Collectors.toList());
            
            Authentication auth = new UsernamePasswordAuthenticationToken(
                email, null, authorities
            );
            context.setAuthentication(auth);
            return context;
        }
    }
}
