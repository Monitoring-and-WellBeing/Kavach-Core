package com.kavach.tenants;

import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "tenants")
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // SCHOOL, COACHING, TRAINING, CORPORATE

    private String city;
    private String state;

    @Column(name = "admin_email", nullable = false)
    private String adminEmail;

    @Column(name = "local_server_enabled")
    private boolean localServerEnabled = false;

    @Column(name = "created_at")
    private Instant createdAt;
}
