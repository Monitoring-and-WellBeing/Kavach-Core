package com.kavach.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitInterceptorTest {

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @InjectMocks
    private RateLimitInterceptor interceptor;

    private StringWriter stringWriter;
    private PrintWriter printWriter;

    @BeforeEach
    void setUp() throws Exception {
        stringWriter = new StringWriter();
        printWriter = new PrintWriter(stringWriter);
    }
    
    private void setupResponseWriter() throws Exception {
        when(response.getWriter()).thenReturn(printWriter);
    }

    @Test
    void testAuthEndpoint_RateLimitExceeded() throws Exception {
        // Given
        setupResponseWriter();
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login");
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        // When - make 11 requests (limit is 10)
        boolean result = true;
        for (int i = 0; i < 11; i++) {
            result = interceptor.preHandle(request, response, null);
        }

        // Then
        assertFalse(result);
        verify(response).setStatus(429);
        verify(response).setHeader(eq("Retry-After"), anyString());
        assertTrue(stringWriter.toString().contains("Too many requests"));
    }

    @Test
    void testAuthEndpoint_WithinLimit() throws Exception {
        // Given
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login");
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("192.168.1.1");

        // When - make 5 requests (within limit of 10)
        boolean result = true;
        for (int i = 0; i < 5; i++) {
            result = interceptor.preHandle(request, response, null);
        }

        // Then
        assertTrue(result);
        verify(response, never()).setStatus(429);
    }

    @Test
    void testOptionsRequest_AlwaysAllowed() throws Exception {
        // Given
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login");
        when(request.getMethod()).thenReturn("OPTIONS");

        // When
        boolean result = interceptor.preHandle(request, response, null);

        // Then
        assertTrue(result);
        verify(response, never()).setStatus(anyInt());
    }

    @Test
    void testXForwardedForHeader_UsedForIpDetection() throws Exception {
        // Given - X-Forwarded-For header is present, so getRemoteAddr() won't be called
        when(request.getRequestURI()).thenReturn("/api/v1/auth/login");
        when(request.getMethod()).thenReturn("POST");
        when(request.getHeader("X-Forwarded-For")).thenReturn("10.0.0.1, 192.168.1.1");

        // When
        boolean result = interceptor.preHandle(request, response, null);

        // Then
        assertTrue(result);
        // Should use first IP from X-Forwarded-For (10.0.0.1) for rate limiting
        verify(request, never()).getRemoteAddr(); // Should not be called when X-Forwarded-For exists
    }
}
