package com.kavach.rewards.dto;

import lombok.Data;

@Data
public class CreateRewardDto {
    private String title;
    private String description;
    private String category;
    private int xpCost;
    private String icon;
}
