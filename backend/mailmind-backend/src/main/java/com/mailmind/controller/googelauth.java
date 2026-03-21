package com.mailmind.controller;

import com.mailmind.dto.OAuthCallbackRequest;
import com.mailmind.model.User;
import com.mailmind.repository.UserRepository;
import com.mailmind.security.JwtUtil;
import com.mailmind.service.GoogleOAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class googelauth {

    private final GoogleOAuthService googleOAuthService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    /**
     * Get Google OAuth Login URL
     * GET /api/auth/google/login-url
     */
    @GetMapping("/google/login-url")
    public ResponseEntity<?> getGoogleLoginUrl() {
        try {
            String authUrl = googleOAuthService.getAuthorizationUrl();
            return ResponseEntity.ok(Map.of(
                "url", authUrl,
                "status", "success"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to generate OAuth URL: " + e.getMessage()
            ));
        }
    }

    /**
     * Google OAuth Callback
     * POST /api/auth/google/callback
     * Body: { "code": "...", "state": "..." }
     */
//    @PostMapping("/google/callback")
//    public ResponseEntity<?> googleCallback(@RequestBody OAuthCallbackRequest request) {
//        try {
//            if (request.getCode() == null || request.getCode().isEmpty()) {
//                return ResponseEntity.badRequest().body(Map.of(
//                    "error", "Authorization code is required"
//                ));
//            }
//
//            // Exchange code for Gmail access token
//            Map<String, Object> tokenResponse = googleOAuthService.exchangeCodeForToken(request.getCode());
//            
//            String accessToken = (String) tokenResponse.get("access_token");
//            String refreshToken = (String) tokenResponse.get("refresh_token");
////            Long expiresIn = (Long) tokenResponse.get("expires_in");
//            Long expiresIn = ((Number) tokenResponse.get("expires_in")).longValue();
//            if (accessToken == null) {
//                return ResponseEntity.badRequest().body(Map.of(
//                    "error", "Failed to get access token from Google"
//                ));
//            }
//
//            // Get user email from request (passed by frontend)
//            String userEmail = request.getUserEmail();
//            if (userEmail == null || userEmail.isEmpty()) {
//                return ResponseEntity.badRequest().body(Map.of(
//                    "error", "User email is required"
//                ));
//            }
//
//            // Find or create user
//            User user = userRepository.findByEmail(userEmail)
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//            // Save Gmail tokens
//            user.setGmailAccessToken(accessToken);
//            user.setGmailRefreshToken(refreshToken);
//            
////            // Calculate expiration time
////            if (expiresIn != null) {
////                long expirationTime = System.currentTimeMillis() + (expiresIn * 1000);
////                user.setGmailTokenExpiresAt(new java.sql.Timestamp(expirationTime));
////            }
//
//         // Calculate expiration time
//            if (expiresIn != null) {
//                long expirationTime = System.currentTimeMillis() + (expiresIn * 1000);
//                user.setGmailTokenExpiresAt(expirationTime);
//            }
//            
//            userRepository.save(user);
//
//            return ResponseEntity.ok(Map.of(
//                "status", "success",
//                "message", "Gmail account connected successfully",
//                "user", Map.of(
//                    "id", user.getId(),
//                    "email", user.getEmail(),
//                    "name", user.getName(),
//                    "gmailConnected", true
//                )
//            ));
//
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of(
//                "error", "OAuth callback failed: " + e.getMessage()
//            ));
//        }
//    }

    @PostMapping("/google/callback")
    public ResponseEntity<?> googleCallback(
            @RequestBody OAuthCallbackRequest request,
            @RequestHeader("Authorization") String token) {  // ADD THIS
        try {
            if (request.getCode() == null || request.getCode().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Authorization code is required"
                ));
            }

            // USE JWT to find user — not request body email
            String userEmail = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

            Map<String, Object> tokenResponse = googleOAuthService.exchangeCodeForToken(request.getCode());

            String accessToken = (String) tokenResponse.get("access_token");
            String refreshToken = (String) tokenResponse.get("refresh_token");
            Long expiresIn = ((Number) tokenResponse.get("expires_in")).longValue();

            if (accessToken == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Failed to get access token from Google"
                ));
            }

            user.setGmailAccessToken(accessToken);
            user.setGmailRefreshToken(refreshToken);

            if (expiresIn != null) {
                long expirationTime = System.currentTimeMillis() + (expiresIn * 1000);
                user.setGmailTokenExpiresAt(expirationTime);
            }

            userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Gmail account connected successfully",
                "user", Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "name", user.getName(),
                    "gmailConnected", true
                )
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "OAuth callback failed: " + e.getMessage()
            ));
        }
    }
    /**
     * Disconnect Gmail Account
     * POST /api/auth/google/disconnect
     */
    @PostMapping("/google/disconnect")
    public ResponseEntity<?> disconnectGmail(@RequestHeader("Authorization") String token) {
        try {
            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

            user.setGmailAccessToken(null);
            user.setGmailRefreshToken(null);
            user.setGmailTokenExpiresAt(null);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Gmail account disconnected"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to disconnect Gmail: " + e.getMessage()
            ));
        }
    }

    /**
     * Check Gmail Connection Status
     * GET /api/auth/google/status
     */
    @GetMapping("/google/status")
    public ResponseEntity<?> getGmailStatus(@RequestHeader("Authorization") String token) {
        try {
            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

            boolean isConnected = user.getGmailAccessToken() != null;

            return ResponseEntity.ok(Map.of(
                "gmailConnected", isConnected,
                "email", user.getEmail(),
                "name", user.getName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
}