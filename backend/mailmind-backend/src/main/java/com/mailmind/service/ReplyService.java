package com.mailmind.service;

import com.google.gson.Gson;
import com.mailmind.dto.AttachmentDTO;
import com.mailmind.dto.SentDTO;
import com.mailmind.model.Email;
import com.mailmind.model.EmailReply;
import com.mailmind.model.User;
import com.mailmind.repository.EmailReplyRepository;
import com.mailmind.repository.EmailRepository;
import com.mailmind.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReplyService {

    private final AIService aiService;
    private final EmailRepository emailRepository;
    private final EmailReplyRepository emailReplyRepository;
    private final UserRepository userRepository;
    private final GoogleOAuthService googleOAuthService;
    private final RestTemplate restTemplate;
    private final Gson gson;

    private static final String GMAIL_SEND_URL =
            "https://www.googleapis.com/gmail/v1/users/me/messages/send";

    // ─────────────────────────────────────────────────────────
    // Generate 4 smart reply variations using Groq AI
    // ─────────────────────────────────────────────────────────
    public List<Map<String, Object>> generateReply(String emailId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Email email = emailRepository.findByUserAndEmailId(user, emailId)
                .orElseThrow(() -> new RuntimeException("Email not found"));

        String emailBody = email.getPlainTextBody() != null && !email.getPlainTextBody().isBlank()
                ? email.getPlainTextBody()
                : email.getBody();

        if (emailBody != null && emailBody.length() > 2000) {
            emailBody = emailBody.substring(0, 2000) + "...";
        }

        return aiService.generateSmartReplies(
                emailBody != null ? emailBody : "",
                email.getSubject() != null ? email.getSubject() : "(No Subject)",
                email.getFrom() != null ? email.getFrom() : "Unknown"
        );
    }

    // ─────────────────────────────────────────────────────────
    // Send reply — supports optional file attachments
    // ─────────────────────────────────────────────────────────
    public void sendReply(String emailId, String replyBody,
                          List<AttachmentDTO> attachments, String userEmail) throws Exception {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getGmailAccessToken() == null) {
            throw new RuntimeException("Gmail account not connected. Please reconnect.");
        }

        Email email = emailRepository.findByUserAndEmailId(user, emailId)
                .orElseThrow(() -> new RuntimeException("Email not found"));

        String accessToken = getValidAccessToken(user);

        String replySubject = email.getSubject() != null && !email.getSubject().startsWith("Re:")
                ? "Re: " + email.getSubject()
                : email.getSubject();

        boolean hasAttachments = attachments != null && !attachments.isEmpty();

        String rawMessage = hasAttachments
                ? buildMultipartMimeMessage(user.getEmail(), email.getFrom(),
                                            replySubject, replyBody, attachments)
                : buildPlainMimeMessage(user.getEmail(), email.getFrom(),
                                        replySubject, replyBody);

        sendViaGmailApi(accessToken, rawMessage, email.getThreadId());

        // Save to reply history
        EmailReply replyRecord = new EmailReply();
        replyRecord.setEmailId(emailId);
        replyRecord.setUser(user);
        replyRecord.setReplyBody(replyBody);
        replyRecord.setSentAt(LocalDateTime.now());
        emailReplyRepository.save(replyRecord);

        // Mark original email as replied
        email.setIsReplied(true);
        email.setRepliedAt(LocalDateTime.now());
        emailRepository.save(email);

        log.info("Reply sent{} for email: {}",
                hasAttachments ? " with " + attachments.size() + " attachment(s)" : "",
                emailId);
    }

    // ─────────────────────────────────────────────────────────
    // Get reply history for an email
    // ─────────────────────────────────────────────────────────
    public List<EmailReply> getReplies(String emailId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        emailRepository.findByUserAndEmailId(user, emailId)
                .orElseThrow(() -> new RuntimeException("Email not found"));

        return emailReplyRepository.findByEmailIdAndUserOrderBySentAtAsc(emailId, user);
    }

    // ─────────────────────────────────────────────────────────
    // Get sent folder — all replies by this user newest first
    // ─────────────────────────────────────────────────────────
    public List<SentDTO> getSentEmails(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return emailReplyRepository.findByUserOrderBySentAtDesc(user)
                .stream().map(reply -> {
                    SentDTO dto = new SentDTO();
                    dto.setId(reply.getId());
                    dto.setOriginalEmailId(reply.getEmailId());
                    dto.setReplyBody(reply.getReplyBody());
                    dto.setSentAt(reply.getSentAt());

                    // Enrich with original email subject + from
                    emailRepository.findById(reply.getEmailId()).ifPresent(original -> {
                        dto.setOriginalSubject(original.getSubject());
                        dto.setOriginalFrom(original.getFrom());
                    });

                    return dto;
                }).collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────
    // Build plain text MIME (no attachments)
    // ─────────────────────────────────────────────────────────
    private String buildPlainMimeMessage(String from, String to,
                                          String subject, String body) {
        StringBuilder mime = new StringBuilder();
        mime.append("From: ").append(from).append("\r\n");
        mime.append("To: ").append(extractEmail(to)).append("\r\n");
        mime.append("Subject: ").append(subject != null ? subject : "").append("\r\n");
        mime.append("MIME-Version: 1.0\r\n");
        mime.append("Content-Type: text/plain; charset=UTF-8\r\n");
        mime.append("\r\n");
        mime.append(body);
        return base64Encode(mime.toString());
    }

    // ─────────────────────────────────────────────────────────
    // Build multipart/mixed MIME (with attachments)
    // ─────────────────────────────────────────────────────────
    private String buildMultipartMimeMessage(String from, String to, String subject,
                                              String body, List<AttachmentDTO> attachments) {
        String boundary = "boundary_" + System.currentTimeMillis();

        StringBuilder mime = new StringBuilder();
        mime.append("From: ").append(from).append("\r\n");
        mime.append("To: ").append(extractEmail(to)).append("\r\n");
        mime.append("Subject: ").append(subject != null ? subject : "").append("\r\n");
        mime.append("MIME-Version: 1.0\r\n");
        mime.append("Content-Type: multipart/mixed; boundary=\"").append(boundary).append("\"\r\n");
        mime.append("\r\n");

        // Text body part
        mime.append("--").append(boundary).append("\r\n");
        mime.append("Content-Type: text/plain; charset=UTF-8\r\n");
        mime.append("Content-Transfer-Encoding: 7bit\r\n");
        mime.append("\r\n");
        mime.append(body).append("\r\n");

        // Attachment parts
        for (AttachmentDTO att : attachments) {
            mime.append("--").append(boundary).append("\r\n");
            mime.append("Content-Type: ").append(att.getMimeType())
                .append("; name=\"").append(att.getFileName()).append("\"\r\n");
            mime.append("Content-Transfer-Encoding: base64\r\n");
            mime.append("Content-Disposition: attachment; filename=\"")
                .append(att.getFileName()).append("\"\r\n");
            mime.append("\r\n");
            mime.append(att.getBase64Data()).append("\r\n");
        }

        mime.append("--").append(boundary).append("--");
        return base64Encode(mime.toString());
    }

    // ─────────────────────────────────────────────────────────
    // POST to Gmail API /messages/send
    // ─────────────────────────────────────────────────────────
    private void sendViaGmailApi(String accessToken, String rawMessage, String threadId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + accessToken);

            Map<String, String> body = threadId != null
                    ? Map.of("raw", rawMessage, "threadId", threadId)
                    : Map.of("raw", rawMessage);

            HttpEntity<String> request = new HttpEntity<>(gson.toJson(body), headers);
            restTemplate.postForObject(GMAIL_SEND_URL, request, String.class);
        } catch (Exception e) {
            log.error("Gmail API send failed: {}", e.getMessage());
            throw new RuntimeException("Failed to send reply via Gmail: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────
    private String extractEmail(String address) {
        if (address != null && address.contains("<") && address.contains(">")) {
            return address.substring(address.indexOf("<") + 1, address.indexOf(">")).trim();
        }
        return address != null ? address : "";
    }

    private String base64Encode(String input) {
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(input.getBytes(StandardCharsets.UTF_8));
    }

    private String getValidAccessToken(User user) {
        if (user.getGmailTokenExpiresAt() != null) {
            long nowPlusBuffer = System.currentTimeMillis() + (60 * 1000);
            if (nowPlusBuffer >= user.getGmailTokenExpiresAt()) {
                log.info("Access token expired, refreshing...");
                return refreshAndSaveToken(user);
            }
        }
        return user.getGmailAccessToken();
    }

    private String refreshAndSaveToken(User user) {
        if (user.getGmailRefreshToken() == null) {
            throw new RuntimeException("No refresh token available. Please reconnect Gmail.");
        }

        Map<String, Object> tokenResponse =
                googleOAuthService.refreshAccessToken(user.getGmailRefreshToken());

        String newAccessToken = (String) tokenResponse.get("access_token");
        if (newAccessToken == null) {
            throw new RuntimeException("Failed to refresh access token. Please reconnect Gmail.");
        }

        user.setGmailAccessToken(newAccessToken);
        Number expiresIn = (Number) tokenResponse.get("expires_in");
        if (expiresIn != null) {
            user.setGmailTokenExpiresAt(
                    System.currentTimeMillis() + (expiresIn.longValue() * 1000));
        }
        userRepository.save(user);
        log.info("Access token refreshed successfully");
        return newAccessToken;
    }
}