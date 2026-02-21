package com.kavach.subscription.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import java.util.UUID;

@Entity
@Table(name = "plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Plan {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(unique = true, nullable = false)
    private String code;                    // BASIC, STANDARD, INSTITUTE

    @Column(nullable = false)
    private String name;

    @Column(name = "plan_type", nullable = false)
    private String planType;               // B2C, B2B

    @Column(name = "price_flat", nullable = false)
    private int priceFlat;                 // flat monthly price in paise

    @Column(name = "max_devices", nullable = false)
    private int maxDevices;               // -1 = unlimited

    @Column(columnDefinition = "TEXT[]")
    private String[] features;

    @Column(name = "is_active")
    private boolean active = true;
}
