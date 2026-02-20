package com.kavach.subscription.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {
    private String planCode;   // BASIC | STANDARD | INSTITUTE
}
