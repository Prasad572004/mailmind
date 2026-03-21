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
//import java.util.HashMap;
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
  //updated after testing - Google expects form-encoded data, not JSON, for token refresh
    public Map<String, Object> refreshAccessToken(String refreshToken) {
        try {
            // form-encoded — same as exchangeCodeForToken
            String body = "client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                          "&client_secret=" + URLEncoder.encode(clientSecret, StandardCharsets.UTF_8) +
                          "&refresh_token=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8) +
                          "&grant_type=refresh_token";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<String> request = new HttpEntity<>(body, headers);
            String response = restTemplate.postForObject(GOOGLE_TOKEN_URL, request, String.class);

            @SuppressWarnings("unchecked")
            Map<String, Object> tokenResponse = gson.fromJson(response, Map.class);

            if (tokenResponse.get("error") != null) {
                throw new RuntimeException("Token refresh error: " + tokenResponse.get("error"));
            }

            return tokenResponse;
        } catch (Exception e) {
            throw new RuntimeException("Failed to refresh access token: " + e.getMessage());
        }
    }
}