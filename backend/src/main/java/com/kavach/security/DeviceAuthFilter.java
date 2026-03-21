package com.kavach.security;

import com.kavach.devices.repository.DeviceRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DeviceAuthFilter extends OncePerRequestFilter {

    private final DeviceRepository deviceRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
        if (!isAgentPath(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        String deviceIdHeader = request.getHeader("X-Device-Id");
        String deviceSecret = request.getHeader("X-Device-Secret");
        if (deviceIdHeader == null || deviceSecret == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        try {
            UUID deviceId = UUID.fromString(deviceIdHeader);
            boolean valid = deviceRepository.existsByIdAndDeviceSecret(deviceId, deviceSecret);
            if (!valid) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
            // GAP-5 FIXED
        } catch (IllegalArgumentException ex) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAgentPath(String uri) {
        return uri.startsWith("/api/v1/enforcement/")
            || uri.startsWith("/api/v1/activity/")
            || uri.startsWith("/api/v1/blocking/")
            || uri.startsWith("/api/v1/screenshots/");
    }
}
