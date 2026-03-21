package com.mailmind.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OAuthCallbackRequest {
    private String code;
    private String state;
    private String userEmail;
}