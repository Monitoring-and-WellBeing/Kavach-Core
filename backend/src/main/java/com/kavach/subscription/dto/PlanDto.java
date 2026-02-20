package com.kavach.subscription.dto;

import lombok.*;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanDto {
    private UUID id;
    private String code;
    private String name;
    private String planType;           // B2C or B2B
    private int priceFlat;             // paise
    private String priceFormatted;     // "₹149/month"
    private int maxDevices;
    private String maxDevicesLabel;    // "3 devices" or "Up to 75 devices"
    private List<String> features;
    private boolean current;
}
