package com.kavach.auth.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SignupRequest {
    @NotBlank private String name;
    @Email @NotBlank private String email;
    @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") private String password;
    private String phone;
    @NotBlank private String instituteName;
    @NotBlank private String instituteType;  // SCHOOL | COACHING | TRAINING
    private String city;
    private String state;
}
