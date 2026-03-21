package com.mailmind.controller;

import com.mailmind.dto.AttachmentDTO;
import com.mailmind.dto.SendEmailRequest;
import com.mailmind.model.User;
import com.mailmind.repository.UserRepository;
import com.mailmind.security.JwtUtil;
import com.mailmind.service.GoogleOAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import com.google.gson.Gson;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@Slf4j
public class EmailController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final GoogleOAuthService googleOAuthService;
    private final RestTemplate restTemplate;
    private final Gson gson;

    private static final String GMAIL_SEND_URL =
            "https://www.googleapis.com/gmail/v1/users/me/messages/send";

    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendEmail(
            @RequestBody SendEmailRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Validate
            if (request.getTo() == null || request.getTo().isEmpty())
                return ResponseEntity.badRequest().body(Map.of("error", "Recipients required"));
            if (request.getSubject() == null || request.getSubject().trim().isEmpty())
                return ResponseEntity.badRequest().body(Map.of("error", "Subject required"));
            if (request.getBody() == null || request.getBody().trim().isEmpty())
                return ResponseEntity.badRequest().body(Map.of("error", "Email body required"));

            // Check Gmail connected
            if (user.getGmailAccessToken() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Gmail not connected. Please connect Gmail to send emails."));
            }

            // Get valid token
            String accessToken = getValidAccessToken(user);

            // Build MIME message
            String rawMessage = buildMimeMessage(
                user.getEmail(),
                request.getTo(),
                request.getSubject(),
                request.getBody(),
                request.getAttachments()
            );

            // Send via Gmail API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + accessToken);

            Map<String, String> body = Map.of("raw", rawMessage);
            HttpEntity<String> httpRequest = new HttpEntity<>(gson.toJson(body), headers);
            restTemplate.postForObject(GMAIL_SEND_URL, httpRequest, String.class);

            log.info("Email sent via Gmail API from {} to {}",
                user.getEmail(), request.getTo());

            return ResponseEntity.ok(Map.of(
                "success",    true,
                "message",    "Email sent successfully",
                "from",       user.getEmail(),
                "recipients", request.getTo().size(),
                "subject",    request.getSubject()
            ));

        } catch (Exception e) {
            log.error("Failed to send email: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ── Build MIME message ────────────────────────────────────
    private String buildMimeMessage(String from, java.util.List<String> to,
                                     String subject, String body,
                                     java.util.List<AttachmentDTO> attachments) {
        boolean hasAttachments = attachments != null && !attachments.isEmpty();

        if (!hasAttachments) {
            return buildPlainMime(from, to, subject, body);
        } else {
            return buildMultipartMime(from, to, subject, body, attachments);
        }
    }

    private String buildPlainMime(String from, java.util.List<String> to,
                                   String subject, String body) {
        StringBuilder mime = new StringBuilder();
        mime.append("From: ").append(from).append("\r\n");
        mime.append("To: ").append(String.join(", ", to)).append("\r\n");
        mime.append("Subject: ").append(subject).append("\r\n");
        mime.append("MIME-Version: 1.0\r\n");
        mime.append("Content-Type: text/plain; charset=UTF-8\r\n");
        mime.append("\r\n");
        mime.append(body);
        return base64Encode(mime.toString());
    }

    private String buildMultipartMime(String from, java.util.List<String> to,
                                       String subject, String body,
                                       java.util.List<AttachmentDTO> attachments) {
        String boundary = "boundary_" + System.currentTimeMillis();
        StringBuilder mime = new StringBuilder();
        mime.append("From: ").append(from).append("\r\n");
        mime.append("To: ").append(String.join(", ", to)).append("\r\n");
        mime.append("Subject: ").append(subject).append("\r\n");
        mime.append("MIME-Version: 1.0\r\n");
        mime.append("Content-Type: multipart/mixed; boundary=\"")
            .append(boundary).append("\"\r\n\r\n");

        mime.append("--").append(boundary).append("\r\n");
        mime.append("Content-Type: text/plain; charset=UTF-8\r\n");
        mime.append("Content-Transfer-Encoding: 7bit\r\n\r\n");
        mime.append(body).append("\r\n");

        for (AttachmentDTO att : attachments) {
            mime.append("--").append(boundary).append("\r\n");
            mime.append("Content-Type: ").append(att.getMimeType())
                .append("; name=\"").append(att.getFileName()).append("\"\r\n");
            mime.append("Content-Transfer-Encoding: base64\r\n");
            mime.append("Content-Disposition: attachment; filename=\"")
                .append(att.getFileName()).append("\"\r\n\r\n");
            mime.append(att.getBase64Data()).append("\r\n");
        }
        mime.append("--").append(boundary).append("--");
        return base64Encode(mime.toString());
    }

    private String base64Encode(String input) {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(input.getBytes(StandardCharsets.UTF_8));
    }

    // ── Token refresh ─────────────────────────────────────────
    private String getValidAccessToken(User user) {
        if (user.getGmailTokenExpiresAt() != null) {
            long nowPlusBuffer = System.currentTimeMillis() + (60 * 1000);
            if (nowPlusBuffer >= user.getGmailTokenExpiresAt()) {
                return refreshAndSaveToken(user);
            }
        }
        return user.getGmailAccessToken();
    }

    private String refreshAndSaveToken(User user) {
        Map<String, Object> tokenResponse =
                googleOAuthService.refreshAccessToken(user.getGmailRefreshToken());
        String newToken = (String) tokenResponse.get("access_token");
        if (newToken == null)
            throw new RuntimeException("Failed to refresh token. Please reconnect Gmail.");
        user.setGmailAccessToken(newToken);
        Number expiresIn = (Number) tokenResponse.get("expires_in");
        if (expiresIn != null)
            user.setGmailTokenExpiresAt(
                System.currentTimeMillis() + (expiresIn.longValue() * 1000));
        userRepository.save(user);
        return newToken;
    }
}