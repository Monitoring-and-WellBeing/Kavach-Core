package com.kavach.rewards.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class RedeemRequestDto {
    private String note;
    private UUID deviceId;
}
