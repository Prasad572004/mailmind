package com.mailmind.controller;

import com.mailmind.dto.AttachmentDTO;
import com.mailmind.dto.SendEmailRequest;
import com.mailmind.model.User;
import com.mailmind.repository.UserRepository;
import com.mailmind.security.JwtUtil;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.util.ByteArrayDataSource;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/email")
//@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class EmailController {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    /**
     * Send email with optional file attachments
     * POST /api/email/send
     * Body: { to, subject, body, attachments (optional) }
     */
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendEmail(
            @RequestBody SendEmailRequest request,
            @RequestHeader("Authorization") String token) {
        try {
            // Verify user is authenticated
            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Validate required fields
            if (request.getTo() == null || request.getTo().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Recipients required"));
            }
            if (request.getSubject() == null || request.getSubject().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Subject required"));
            }
            if (request.getBody() == null || request.getBody().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email body required"));
            }

            boolean hasAttachments = request.getAttachments() != null
                    && !request.getAttachments().isEmpty();

            // Use MimeMessage — supports both plain text and attachments
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage,
                    hasAttachments,   // multipart only when needed
                    "UTF-8"
            );

            helper.setFrom(user.getEmail());
            helper.setTo(request.getTo().toArray(new String[0]));
            helper.setSubject(request.getSubject());
            helper.setText(request.getBody(), false); // false = plain text

            // Add attachments if present
            if (hasAttachments) {
                for (AttachmentDTO att : request.getAttachments()) {
                    if (att.getFileName() == null || att.getBase64Data() == null) continue;

                    byte[] fileBytes = Base64.getDecoder().decode(att.getBase64Data());
                    String mimeType  = att.getMimeType() != null
                            ? att.getMimeType()
                            : "application/octet-stream";

                    helper.addAttachment(
                            att.getFileName(),
                            new ByteArrayDataSource(fileBytes, mimeType)
                    );
                }
            }

            mailSender.send(mimeMessage);

            return ResponseEntity.ok(Map.of(
                    "success",    true,
                    "message",    "Email sent successfully",
                    "recipients", request.getTo().size(),
                    "subject",    request.getSubject(),
                    "attachments", hasAttachments ? request.getAttachments().size() : 0
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}