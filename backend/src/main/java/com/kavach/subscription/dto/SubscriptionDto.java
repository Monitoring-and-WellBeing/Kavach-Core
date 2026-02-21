package com.kavach.subscription.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionDto {
    private String planCode;
    private String planName;
    private String planType;           // B2C or B2B
    private String status;             // ACTIVE | TRIAL | EXPIRED | CANCELLED
    private boolean isTrial;
    private LocalDateTime trialEndsAt;
    private LocalDateTime periodEnd;
    private int deviceCount;
    private int maxDevices;
    private String maxDevicesLabel;
    private double deviceUsagePercent;
    private int daysRemaining;
    private boolean nearLimit;         // device count >= 80% of max
    private boolean atLimit;           // device count >= max
    private List<String> features;
    private int monthlyTotal;          // flat price in paise
    private String monthlyTotalFormatted; // "₹149/month"
}
