package com.kavach.subscription.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyPaymentRequest {
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
    private String planCode;
}
