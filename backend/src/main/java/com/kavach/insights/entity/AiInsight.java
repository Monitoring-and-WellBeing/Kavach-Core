package com.kavach.insights.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.GenericGenerator;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "ai_insights")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AiInsight {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "device_id", nullable = false)
    private UUID deviceId;

    @Column(name = "raw_response", columnDefinition = "TEXT")
    private String rawResponse;

    @Column(name = "weekly_summary", columnDefinition = "TEXT")
    private String weeklySummary;

    @Column(name = "risk_level")
    private String riskLevel = "LOW";

    @Column(name = "risk_tags", columnDefinition = "TEXT[]")
    private String[] riskTags;

    @Column(name = "positive_tags", columnDefinition = "TEXT[]")
    private String[] positiveTags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<Map<String, Object>> insights;

    @Column(name = "generated_at")
    private LocalDateTime generatedAt = LocalDateTime.now();

    @Column(name = "data_from")
    private LocalDateTime dataFrom;

    @Column(name = "data_to")
    private LocalDateTime dateTo;
}
