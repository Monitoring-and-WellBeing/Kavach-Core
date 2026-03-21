package com.kavach.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private static final String TOKEN_PARAM = "token";
    private final JwtService jwtService;
    private final StringRedisTemplate redisTemplate;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        // Primary: Bearer token in Authorization header
        // Fallback: ?token= query parameter — used by EventSource (SSE) which
        // cannot set custom headers, so the JWT is passed as a query param instead.
        String authHeader = req.getHeader("Authorization");
        String token;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        } else if (req.getParameter(TOKEN_PARAM) != null) {
            token = req.getParameter(TOKEN_PARAM);
        } else {
            chain.doFilter(req, res);
            return;
        }

        if (req.getParameter(TOKEN_PARAM) != null) {
            String redisValue = redisTemplate.opsForValue().get("sse:token:" + token);
            if (redisValue != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                var auth = new UsernamePasswordAuthenticationToken(
                    "sse-token", null, List.of(new SimpleGrantedAuthority("ROLE_PARENT"))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
                req.setAttribute("tenantId", redisValue);
                chain.doFilter(req, res);
                return;
            }
            // GAP-4 FIXED
        }
        if (!jwtService.isTokenValid(token)) {
            // Token was provided but is expired or tampered — return 401 explicitly.
            // Without this, Spring Security falls through to anonymous auth and returns
            // 403, which bypasses the axios auto-refresh interceptor on the frontend.
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write("{\"error\":\"Token expired or invalid\",\"code\":\"TOKEN_EXPIRED\"}");
            return;
        }

        String email = jwtService.extractEmail(token);
        String role = jwtService.extractRole(token);
        String tenantId = jwtService.extractTenantId(token);

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            var auth = new UsernamePasswordAuthenticationToken(
                    email, null,
                    List.of(new SimpleGrantedAuthority("ROLE_" + role))
            );
            auth.setDetails(token);
            SecurityContextHolder.getContext().setAuthentication(auth);
            
            // Set request attributes for rate limiting
            req.setAttribute("email", email);
            if (tenantId != null && !tenantId.isEmpty()) {
                req.setAttribute("tenantId", tenantId);
            }
        }

        chain.doFilter(req, res);
    }
}
