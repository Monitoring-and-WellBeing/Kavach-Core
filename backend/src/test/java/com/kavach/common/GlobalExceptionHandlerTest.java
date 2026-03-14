package com.kavach.common;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void testHandleBadCredentials() {
        // Given
        BadCredentialsException ex = new BadCredentialsException("Invalid credentials");

        // When
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = 
                handler.handleBadCredentials(ex);

        // Then
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(401, response.getBody().status());
        assertEquals("Invalid credentials", response.getBody().message());
    }

    @Test
    void testHandleIllegalArgument() {
        // Given
        IllegalArgumentException ex = new IllegalArgumentException("Invalid input");

        // When
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = 
                handler.handleIllegalArg(ex);

        // Then
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().status());
    }

    @Test
    void testHandleValidation() {
        // Given
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("object", "field", "error message");

        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getFieldErrors()).thenReturn(Collections.singletonList(fieldError));

        // When
        ResponseEntity<Map<String, Object>> response = handler.handleValidation(ex);

        // Then
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("error"));
        assertTrue(response.getBody().containsKey("details"));
    }

    @Test
    void testHandleGeneralException_NoStackTrace() {
        // Given
        Exception ex = new RuntimeException("Internal error");

        // When
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = 
                handler.handleGeneral(ex);

        // Then
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().status());
        assertEquals("An internal error occurred", response.getBody().message());
        // Should not contain stack trace or internal details
        assertFalse(response.getBody().message().contains("RuntimeException"));
    }

    @Test
    void testHandleRuntimeException_UserFriendlyMessage() {
        // Given
        RuntimeException ex = new RuntimeException("User-friendly error message");

        // When
        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response = 
                handler.handleRuntime(ex);

        // Then
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().status());
    }
}
