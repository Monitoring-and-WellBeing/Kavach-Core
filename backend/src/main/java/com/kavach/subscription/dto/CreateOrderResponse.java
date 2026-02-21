package com.kavach.subscription.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderResponse {
    private String orderId;          // Razorpay order_xxx — passed to SDK
    private int amount;              // paise
    private String currency;         // INR
    private String keyId;            // Razorpay public key (safe for frontend)
    private String planName;
    private String planCode;
    private String description;      // "Kavach AI — Standard Plan (₹299/month)"
}
