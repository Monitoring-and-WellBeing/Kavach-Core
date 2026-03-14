package com.kavach.security;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class RateLimitInterceptor implements HandlerInterceptor {

    // Per-IP buckets for auth endpoints
    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    
    // Per-tenant buckets for insights refresh
    private final Map<String, Bucket> insightsBuckets = new ConcurrentHashMap<>();
    
    // Per-user buckets for general API
    private final Map<String, Bucket> userBuckets = new ConcurrentHashMap<>();

    // Auth endpoints: 10 requests per minute per IP
    private Bucket getAuthBucket(String key) {
        return authBuckets.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(limit -> limit.capacity(10)
                        .refillIntervally(10, Duration.ofMinutes(1)))
                .build());
    }

    // Insights refresh: 5 requests per hour per tenant
    private Bucket getInsightsBucket(String key) {
        return insightsBuckets.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(limit -> limit.capacity(5)
                        .refillIntervally(5, Duration.ofHours(1)))
                .build());
    }

    // General API: 100 requests per minute per user
    private Bucket getUserBucket(String key) {
        return userBuckets.computeIfAbsent(key, k -> Bucket.builder()
                .addLimit(limit -> limit.capacity(100)
                        .refillIntervally(100, Duration.ofMinutes(1)))
                .build());
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // X-Forwarded-For can contain multiple IPs, take the first one
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // Skip OPTIONS requests
        if ("OPTIONS".equals(method)) {
            return true;
        }

        // Auth endpoints: rate limit by IP
        if (path.startsWith("/api/v1/auth/login") || path.startsWith("/api/v1/auth/signup")) {
            String ip = getClientIp(request);
            Bucket bucket = getAuthBucket(ip);
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
            
            if (!probe.isConsumed()) {
                long retryAfter = probe.getNanosToWaitForRefill() / 1_000_000_000;
                response.setStatus(429);
                response.setHeader("Retry-After", String.valueOf(retryAfter));
                response.setContentType("application/json");
                try {
                    response.getWriter().write(
                            String.format("{\"error\":\"Too many requests\",\"retryAfter\":%d}", retryAfter)
                    );
                } catch (Exception e) {
                    log.error("Failed to write rate limit response", e);
                }
                log.warn("[rate-limit] Auth endpoint rate limit exceeded for IP: {}", ip);
                return false;
            }
            return true;
        }

        // Insights refresh: rate limit by tenant (extracted from JWT if available)
        if (path.contains("/insights/") && path.contains("/refresh")) {
            String tenantKey = getTenantKey(request);
            if (tenantKey != null) {
                Bucket bucket = getInsightsBucket(tenantKey);
                ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
                
                if (!probe.isConsumed()) {
                    long retryAfter = probe.getNanosToWaitForRefill() / 1_000_000_000;
                    response.setStatus(429);
                    response.setHeader("Retry-After", String.valueOf(retryAfter));
                    response.setContentType("application/json");
                    try {
                        response.getWriter().write(
                                String.format("{\"error\":\"Too many requests\",\"retryAfter\":%d}", retryAfter)
                        );
                    } catch (Exception e) {
                        log.error("Failed to write rate limit response", e);
                    }
                    log.warn("[rate-limit] Insights refresh rate limit exceeded for tenant: {}", tenantKey);
                    return false;
                }
            }
            return true;
        }

        // All other /api/v1/** endpoints: rate limit by user (from JWT if available)
        if (path.startsWith("/api/v1/")) {
            String userKey = getUserKey(request);
            if (userKey != null) {
                Bucket bucket = getUserBucket(userKey);
                ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
                
                if (!probe.isConsumed()) {
                    long retryAfter = probe.getNanosToWaitForRefill() / 1_000_000_000;
                    response.setStatus(429);
                    response.setHeader("Retry-After", String.valueOf(retryAfter));
                    response.setContentType("application/json");
                    try {
                        response.getWriter().write(
                                String.format("{\"error\":\"Too many requests\",\"retryAfter\":%d}", retryAfter)
                        );
                    } catch (Exception e) {
                        log.error("Failed to write rate limit response", e);
                    }
                    log.warn("[rate-limit] API rate limit exceeded for user: {}", userKey);
                    return false;
                }
            }
        }

        return true;
    }

    private String getTenantKey(HttpServletRequest request) {
        // Try to extract tenant from request attribute (set by JwtFilter)
        Object tenantId = request.getAttribute("tenantId");
        if (tenantId != null) {
            return tenantId.toString();
        }
        // Fallback to IP if JWT not available
        return getClientIp(request);
    }

    private String getUserKey(HttpServletRequest request) {
        // Try to extract user email from request attribute (set by JwtFilter)
        Object email = request.getAttribute("email");
        if (email != null) {
            return email.toString();
        }
        // Also try SecurityContext as fallback
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof String) {
            return (String) auth.getPrincipal();
        }
        // Fallback to IP for unauthenticated requests
        return getClientIp(request);
    }
}
