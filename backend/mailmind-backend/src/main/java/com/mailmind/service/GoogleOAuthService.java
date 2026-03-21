package com.mailmind.service;

import com.google.gson.Gson;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GoogleOAuthService {

    private final RestTemplate restTemplate;
    private final Gson gson;

    @Value("${google.oauth.client-id}")
    private String clientId;

    @Value("${google.oauth.client-secret}")
    private String clientSecret;

    @Value("${google.oauth.redirect-uri}")
    private String redirectUri;

    // Google OAuth URLs
    private static final String GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    private static final String GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

    // Gmail scopes
    private static final String GMAIL_SCOPES = 
        "https://www.googleapis.com/auth/gmail.readonly " +
        "https://www.googleapis.com/auth/gmail.modify " +
        "https://www.googleapis.com/auth/gmail.send";

    /**
     * Generate Google OAuth Authorization URL
     */
    public String getAuthorizationUrl() {
        try {
            String scope = URLEncoder.encode(GMAIL_SCOPES, StandardCharsets.UTF_8);
            String redirectUrl = URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);

            String authUrl = GOOGLE_AUTH_URL +
                    "?client_id=" + clientId +
                    "&redirect_uri=" + redirectUrl +
                    "&response_type=code" +
                    "&scope=" + scope +
                    "&access_type=offline" +
                    "&prompt=consent";

            return authUrl;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate authorization URL: " + e.getMessage());
        }
    }

    /**
     * Exchange authorization code for access token
     */
//    public Map<String, Object> exchangeCodeForToken(String code) {
//        try {
//            // Prepare request body
//            Map<String, String> tokenRequest = new HashMap<>();
//            tokenRequest.put("client_id", clientId);
//            tokenRequest.put("client_secret", clientSecret);
//            tokenRequest.put("code", code);
//            tokenRequest.put("grant_type", "authorization_code");
//            tokenRequest.put("redirect_uri", redirectUri);
//
//            // Prepare headers
//            HttpHeaders headers = new HttpHeaders();
//            headers.setContentType(MediaType.APPLICATION_JSON);
//
//            // Make request to Google
//            HttpEntity<String> request = new HttpEntity<>(gson.toJson(tokenRequest), headers);
//            String response = restTemplate.postForObject(GOOGLE_TOKEN_URL, request, String.class);
//
//            // Parse response
//            @SuppressWarnings("unchecked")
//            Map<String, Object> tokenResponse = gson.fromJson(response, Map.class);
//
//            if (tokenResponse.get("error") != null) {
//                throw new RuntimeException("Google OAuth error: " + tokenResponse.get("error"));
//            }
//
//            return tokenResponse;
//        } catch (Exception e) {
//            throw new RuntimeException("Failed to exchange code for token: " + e.getMessage());
//        }
//    }
    
    public Map<String, Object> exchangeCodeForToken(String code) {
        try {
            // Build form-encoded body — NOT JSON
            String body = "client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                          "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8) +
                          "&code=" + URLEncoder.encode(code, StandardCharsets.UTF_8) +
                          "&grant_type=authorization_code" +
                          "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED); // ← KEY CHANGE

            HttpEntity<String> request = new HttpEntity<>(body, headers);
            String response = restTemplate.postForObject(GOOGLE_TOKEN_URL, request, String.class);

            @SuppressWarnings("unchecked")
            Map<String, Object> tokenResponse = gson.fromJson(response, Map.class);

            if (tokenResponse.get("error") != null) {
                throw new RuntimeException("Google OAuth error: " + tokenResponse.get("error"));
            }

            return tokenResponse;
        } catch (Exception e) {
            throw new RuntimeException("Failed to exchange code for token: " + e.getMessage());
        }
    }

    /**
     * Refresh access token using refresh token
     */
    public Map<String, Object> refreshAccessToken(String refreshToken) {
        try {
            // Prepare request body
            Map<String, String> refreshRequest = new HashMap<>();
            refreshRequest.put("client_id", clientId);
            refreshRequest.put("client_secret", clientSecret);
            refreshRequest.put("refresh_token", refreshToken);
            refreshRequest.put("grant_type", "refresh_token");

            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Make request to Google
            HttpEntity<String> request = new HttpEntity<>(gson.toJson(refreshRequest), headers);
            String response = restTemplate.postForObject(GOOGLE_TOKEN_URL, request, String.class);

            // Parse response
            @SuppressWarnings("unchecked")
            Map<String, Object> tokenResponse = gson.fromJson(response, Map.class);

            return tokenResponse;
        } catch (Exception e) {
            throw new RuntimeException("Failed to refresh access token: " + e.getMessage());
        }
    }
}