package com.kavach.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SignupRequest {
    @NotBlank private String name;
    @Email @NotBlank private String email;
    @NotBlank @Size(min = 8, message = "Password must be at least 8 characters") private String password;
    private String phone;
    // "PARENT" or "INSTITUTE_ADMIN" (defaults to INSTITUTE_ADMIN when absent)
    private String role;
    // Required for INSTITUTE_ADMIN, ignored for PARENT
    private String instituteName;
    private String instituteType;  // SCHOOL | COACHING | TRAINING
    private String city;
    private String state;
}
