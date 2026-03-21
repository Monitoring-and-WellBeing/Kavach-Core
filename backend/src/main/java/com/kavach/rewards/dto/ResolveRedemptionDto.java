package com.kavach.rewards.dto;

import lombok.Data;

@Data
public class ResolveRedemptionDto {
    /** "APPROVED" or "DENIED" */
    private String status;
    private String parentNote;
}
