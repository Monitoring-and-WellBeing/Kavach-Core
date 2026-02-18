package com.kavach.subscription;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "subscriptions")
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", unique = true, nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private String plan = "FREE_TRIAL"; // FREE_TRIAL, STARTER, INSTITUTE, ENTERPRISE

    @Column(name = "device_limit")
    private int deviceLimit = 5;

    @Column(name = "price_per_device", precision = 10, scale = 2)
    private BigDecimal pricePerDevice = BigDecimal.ZERO;

    @Column(name = "billing_cycle")
    private String billingCycle = "MONTHLY"; // MONTHLY, ANNUAL

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(nullable = false)
    private String status = "TRIAL"; // ACTIVE, EXPIRED, TRIAL

    @Column(name = "created_at")
    private Instant createdAt;
}
