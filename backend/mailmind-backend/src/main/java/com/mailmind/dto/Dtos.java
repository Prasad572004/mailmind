package com.mailmind.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// ========== AUTH DTOs ==========

@Data
class RegisterRequest {
    @NotBlank private String name;
    @Email @NotBlank private String email;
    @NotBlank private String password;
}

@Data
class LoginRequest {
    @Email @NotBlank private String email;
    @NotBlank private String password;
}

@Data
class AuthResponse {
    private String token;
    private String name;
    private String email;
    private Long userId;

    public AuthResponse(String token, String name, String email, Long userId) {
        this.token = token;
        this.name = name;
        this.email = email;
        this.userId = userId;
    }
}

// ========== CAMPAIGN DTOs ==========

@Data
class CampaignRequest {
    @NotBlank private String title;
    @NotBlank private String roughIdea;
}

@Data
class CampaignResponse {
    private Long id;
    private String title;
    private String roughIdea;
    private String status;
    private String createdAt;
    private int variationCount;
}

// ========== AI DTOs ==========

@Data
class GenerateEmailRequest {
    @NotBlank private String roughIdea;
    private Long campaignId;
}

@Data
class SmartReplyRequest {
    @NotBlank private String originalEmail;
    private String originalSubject;
    private String senderEmail;
}

@Data
class EmailVariationResponse {
    private Long id;
    private String tone;
    private String subjectLine;
    private String body;
    private Double predictedOpenRate;
    private Boolean isSelected;
}
