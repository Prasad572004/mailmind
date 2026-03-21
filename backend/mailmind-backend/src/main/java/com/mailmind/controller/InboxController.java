
//package com.mailmind.controller;
//
//import com.mailmind.dto.EmailDTO;
//import com.mailmind.dto.EmailListDTO;
//import com.mailmind.model.Email;
//import com.mailmind.model.User;
//import com.mailmind.repository.EmailRepository;
//import com.mailmind.repository.UserRepository;
//import com.mailmind.service.GmailSyncService;
//import com.mailmind.service.ReplyService;
//import com.mailmind.security.JwtUtil;
//import lombok.RequiredArgsConstructor;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//import java.util.List;
//import java.util.Map;
//import java.util.stream.Collectors;
//
//@RestController
//@RequestMapping("/api/inbox")
//@RequiredArgsConstructor
//@CrossOrigin(origins = "*")
//public class InboxController {
//
//    private final EmailRepository emailRepository;
//    private final UserRepository userRepository;
//    private final GmailSyncService gmailSyncService;
//    private final ReplyService replyService;
//    private final JwtUtil jwtUtil;
//
//    /**
//     * Sync emails from Gmail
//     * POST /api/inbox/sync
//     */
//    @PostMapping("/sync")
//    public ResponseEntity<?> syncEmails(@RequestHeader("Authorization") String token) {
//        try {
//            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
//            User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//            if (user.getGmailAccessToken() == null) {
//                return ResponseEntity.badRequest().body(Map.of(
//                    "error", "Gmail account not connected. Please reconnect."
//                ));
//            }
//
//            gmailSyncService.syncEmails(user);
//
//            return ResponseEntity.ok(Map.of(
//                "status", "success",
//                "message", "Emails synced successfully"
//            ));
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of(
//                "error", "Failed to sync emails: " + e.getMessage()
//            ));
//        }
//    }
//
//    /**
//     * Get inbox emails
//     * GET /api/inbox
//     */
//    @GetMapping("")
//    public ResponseEntity<?> getInboxEmails(@RequestHeader("Authorization") String token) {
//        try {
//            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
//            User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//            List<Email> emails = emailRepository.findInboxEmails(user);
//            List<EmailListDTO> dtos = emails.stream()
//                .map(this::convertToListDTO)
//                .collect(Collectors.toList());
//
//            return ResponseEntity.ok(dtos);
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of(
//                "error", e.getMessage()
//            ));
//        }
//    }
//
//    /**
//     * Get email detail
//     * GET /api/inbox/{id}
//     */
//    @GetMapping("/{id}")
//    public ResponseEntity<?> getEmailDetail(
//        @PathVariable String id,
//        @RequestHeader("Authorization") String token) {
//
//        try {
//            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
//            User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//            Email emailEntity = emailRepository.findByUserAndEmailId(user, id)
//                .orElseThrow(() -> new RuntimeException("Email not found"));
//
//            emailEntity.setIsRead(true);
//            emailRepository.save(emailEntity);
//
//            return ResponseEntity.ok(convertToDetailDTO(emailEntity));
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of(
//                "error", e.getMessage()
//            ));
//        }
//    }
//
//    /**
//     * Get email thread (conversation)
//     * GET /api/inbox/thread/{threadId}
//     */
//    @GetMapping("/thread/{threadId}")
//    public ResponseEntity<?> getEmailThread(@PathVariable String threadId) {
//        try {
//            List<Email> emails = emailRepository.findByThreadIdOrderByReceivedAtAsc(threadId);
//            List<EmailListDTO> dtos = emails.stream()
//                .map(this::convertToListDTO)
//                .collect(Collectors.toList());
//
//            return ResponseEntity.ok(dtos);
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of(
//                "error", e.getMessage()
//            ));
//        }
//    }
//
//    /**
//     * Search emails
//     * GET /api/inbox/search?query=xxx
//     */
//    @GetMapping("/search")
//    public ResponseEntity<?> searchEmails(
//        @RequestParam String query,
//        @RequestHeader("Authorization") String token) {
//
//        try {
//            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
//            User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//            List<Email> emails = emailRepository.searchEmails(user, query);
//            List<EmailListDTO> dtos = emails.stream()
//                .map(this::convertToListDTO)
//                .collect(Collectors.toList());
//
//            return ResponseEntity.ok(dtos);
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of(
//                "error", e.getMessage()
//            ));
//        }
//    }
//
//    /**
//     * Mark email as read
//     * PUT /api/inbox/{id}/read
//     */
//    @PutMapping("/{id}/read")
//    public ResponseEntity<?> markAsRead(
//        @PathVariable String id,
//        @RequestHeader("Authorization") String token) {
//
//        try {
//            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
//            User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//            Email emailEntity = emailRepository.findByUserAndEmailId(user, id)
//                .orElseThrow(() -> new RuntimeException("Email not found"));
//
//            emailEntity.setIsRead(true);
//            emailRepository.save(emailEntity);
//
//            return ResponseEntity.ok(Map.of("status", "success", "message", "Email marked as read"));
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
//        }
//    }
//
//    /**
//     * Mark email as unread
//     * PUT /api/inbox/{id}/unread
//     */
//    @PutMapping("/{id}/unread")
//    public ResponseEntity<?> markAsUnread(
//        @PathVariable String id,
//        @RequestHeader("Authorization") String token) {
//
//        try {
//            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
//            User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//            Email emailEntity = emailRepository.findByUserAndEmailId(user, id)
//                .orElseThrow(() -> new RuntimeException("Email not found"));
//
//            emailEntity.setIsRead(false);
//            emailRepository.save(emailEntity);
//
//            return ResponseEntity.ok(Map.of("status", "success", "message", "Email marked as unread"));
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
//        }
//    }
//
//    /**
//     * Star/unstar email
//     * PUT /api/inbox/{id}/star
//     */
//    @PutMapping("/{id}/star")
//    public ResponseEntity<?> starEmail(
//        @PathVariable String id,
//        @RequestHeader("Authorization") String token) {
//
//        try {
//            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
//            User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//            Email emailEntity = emailRepository.findByUserAndEmailId(user, id)
//                .orElseThrow(() -> new RuntimeException("Email not found"));
//
//            emailEntity.setIsStarred(!emailEntity.getIsStarred());
//            emailRepository.save(emailEntity);
//
//            return ResponseEntity.ok(Map.of(
//                "status", "success",
//                "message", "Email " + (emailEntity.getIsStarred() ? "starred" : "unstarred")
//            ));
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
//        }
//    }
//
//    /**
//     * Get unread count
//     * GET /api/inbox/count/unread
//     */
//    @GetMapping("/count/unread")
//    public ResponseEntity<?> getUnreadCount(@RequestHeader("Authorization") String token) {
//        try {
//            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
//            User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//            Long count = emailRepository.countByUserAndIsReadFalse(user);
//
//            return ResponseEntity.ok(Map.of("unreadCount", count));
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
//        }
//    }
//
//    // ══════════════════════════════════════════════════════════
//    // SMART REPLY ENDPOINTS
//    // ══════════════════════════════════════════════════════════
//
//    /**
//     * Generate 4 AI reply variations for an email
//     * POST /api/inbox/{id}/generate-reply
//     */
//    @PostMapping("/{id}/generate-reply")
//    public ResponseEntity<?> generateReply(
//        @PathVariable String id,
//        @RequestHeader("Authorization") String token) {
//
//        try {
//            String userEmail = jwtUtil.extractEmail(token.replace("Bearer ", ""));
//            List<java.util.Map<String, Object>> variations =
//                replyService.generateReply(id, userEmail);
//
//            return ResponseEntity.ok(Map.of(
//                "status", "success",
//                "variations", variations
//            ));
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of(
//                "error", "Failed to generate reply: " + e.getMessage()
//            ));
//        }
//    }
//
//    /**
//     * Send a reply via Gmail API and mark email as replied
//     * POST /api/inbox/{id}/send-reply
//     * Body: { "replyBody": "..." }
//     */
//    @PostMapping("/{id}/send-reply")
//    public ResponseEntity<?> sendReply(
//        @PathVariable String id,
//        @RequestBody Map<String, String> request,
//        @RequestHeader("Authorization") String token) {
//
//        try {
//            String replyBody = request.get("replyBody");
//            if (replyBody == null || replyBody.isBlank()) {
//                return ResponseEntity.badRequest().body(Map.of(
//                    "error", "Reply body is required"
//                ));
//            }
//
//            String userEmail = jwtUtil.extractEmail(token.replace("Bearer ", ""));
//            replyService.sendReply(id, replyBody, userEmail);
//
//            return ResponseEntity.ok(Map.of(
//                "status", "success",
//                "message", "Reply sent successfully"
//            ));
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of(
//                "error", "Failed to send reply: " + e.getMessage()
//            ));
//        }
//    }
//
//    // ══════════════════════════════════════════════════════════
//    // DTO Converters
//    // ══════════════════════════════════════════════════════════
//
//    private EmailListDTO convertToListDTO(Email email) {
//        EmailListDTO dto = new EmailListDTO();
//        dto.setId(email.getEmailId());
//        dto.setFrom(email.getFrom());
//        dto.setSubject(email.getSubject());
//
//        String preview = email.getPlainTextBody();
//        if (preview == null) preview = "";
//        dto.setPreview(preview.substring(0, Math.min(100, preview.length())));
//
//        dto.setDate(email.getReceivedAt());
//        dto.setIsRead(email.getIsRead());
//        dto.setIsStarred(email.getIsStarred());
//        dto.setThreadId(email.getThreadId());
//
//        return dto;
//    }
//
//    private EmailDTO convertToDetailDTO(Email email) {
//        EmailDTO dto = new EmailDTO();
//        dto.setId(email.getEmailId());
//        dto.setFrom(email.getFrom());
//        dto.setTo(email.getTo());
//        dto.setSubject(email.getSubject());
//        dto.setBody(email.getBody());
//        dto.setDate(email.getReceivedAt());
//        dto.setIsRead(email.getIsRead());
//        dto.setIsStarred(email.getIsStarred());
//        dto.setThreadId(email.getThreadId());
//        dto.setIsReplied(email.getIsReplied());
//        dto.setRepliedAt(email.getRepliedAt());
//
//        return dto;
//    }
//}

package com.mailmind.controller;

import com.mailmind.dto.AttachmentDTO;
import com.mailmind.dto.EmailDTO;
import com.mailmind.dto.EmailListDTO;
import com.mailmind.dto.SentDTO;
import com.mailmind.model.Email;
import com.mailmind.model.EmailReply;
import com.mailmind.model.User;
import com.mailmind.repository.EmailRepository;
import com.mailmind.repository.UserRepository;
import com.mailmind.service.GmailSyncService;
import com.mailmind.service.ReplyService;
import com.mailmind.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inbox")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InboxController {

    private final EmailRepository emailRepository;
    private final UserRepository userRepository;
    private final GmailSyncService gmailSyncService;
    private final ReplyService replyService;
    private final JwtUtil jwtUtil;

    @PostMapping("/sync")
    public ResponseEntity<?> syncEmails(@RequestHeader("Authorization") String token) {
        try {
            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
            if (user.getGmailAccessToken() == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Gmail account not connected. Please reconnect."));
            }
            gmailSyncService.syncEmails(user);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Emails synced successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to sync emails: " + e.getMessage()));
        }
    }

    @GetMapping("")
    public ResponseEntity<?> getInboxEmails(@RequestHeader("Authorization") String token) {
        try {
            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
            List<Email> emails = emailRepository.findInboxEmails(user);
            return ResponseEntity.ok(emails.stream().map(this::convertToListDTO).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEmailDetail(
        @PathVariable String id,
        @RequestHeader("Authorization") String token) {
        try {
            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
            Email emailEntity = emailRepository.findByUserAndEmailId(user, id)
                .orElseThrow(() -> new RuntimeException("Email not found"));
            emailEntity.setIsRead(true);
            emailRepository.save(emailEntity);
            return ResponseEntity.ok(convertToDetailDTO(emailEntity));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/thread/{threadId}")
    public ResponseEntity<?> getEmailThread(@PathVariable String threadId) {
        try {
            List<Email> emails = emailRepository.findByThreadIdOrderByReceivedAtAsc(threadId);
            return ResponseEntity.ok(emails.stream().map(this::convertToListDTO).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchEmails(
        @RequestParam String query,
        @RequestHeader("Authorization") String token) {
        try {
            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
            List<Email> emails = emailRepository.searchEmails(user, query);
            return ResponseEntity.ok(emails.stream().map(this::convertToListDTO).collect(Collectors.toList()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id, @RequestHeader("Authorization") String token) {
        try {
            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
            Email e = emailRepository.findByUserAndEmailId(user, id).orElseThrow(() -> new RuntimeException("Email not found"));
            e.setIsRead(true); emailRepository.save(e);
            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/unread")
    public ResponseEntity<?> markAsUnread(@PathVariable String id, @RequestHeader("Authorization") String token) {
        try {
            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
            Email e = emailRepository.findByUserAndEmailId(user, id).orElseThrow(() -> new RuntimeException("Email not found"));
            e.setIsRead(false); emailRepository.save(e);
            return ResponseEntity.ok(Map.of("status", "success"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/star")
    public ResponseEntity<?> starEmail(@PathVariable String id, @RequestHeader("Authorization") String token) {
        try {
            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
            Email e = emailRepository.findByUserAndEmailId(user, id).orElseThrow(() -> new RuntimeException("Email not found"));
            e.setIsStarred(!Boolean.TRUE.equals(e.getIsStarred())); emailRepository.save(e);
            return ResponseEntity.ok(Map.of("status", "success", "isStarred", e.getIsStarred()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/count/unread")
    public ResponseEntity<?> getUnreadCount(@RequestHeader("Authorization") String token) {
        try {
            String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
            return ResponseEntity.ok(Map.of("unreadCount", emailRepository.countByUserAndIsReadFalse(user)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ══════════════════════════════════════════════════════════
    // SMART REPLY
    // ══════════════════════════════════════════════════════════

    @PostMapping("/{id}/generate-reply")
    public ResponseEntity<?> generateReply(
        @PathVariable String id,
        @RequestHeader("Authorization") String token) {
        try {
            String userEmail = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            List<Map<String, Object>> variations = replyService.generateReply(id, userEmail);
            return ResponseEntity.ok(Map.of("status", "success", "variations", variations));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to generate reply: " + e.getMessage()));
        }
    }

    /**
     * Send reply with optional attachments
     * POST /api/inbox/{id}/send-reply
     * Body: { "replyBody": "...", "attachments": [...] }
     */
    @PostMapping("/{id}/send-reply")
    public ResponseEntity<?> sendReply(
        @PathVariable String id,
        @RequestBody Map<String, Object> request,
        @RequestHeader("Authorization") String token) {
        try {
            String replyBody = (String) request.get("replyBody");
            if (replyBody == null || replyBody.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Reply body is required"));
            }

            // Parse optional attachments
            List<AttachmentDTO> attachments = null;
            if (request.containsKey("attachments") && request.get("attachments") != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, String>> rawAttachments =
                    (List<Map<String, String>>) request.get("attachments");
                attachments = rawAttachments.stream().map(a -> {
                    AttachmentDTO dto = new AttachmentDTO();
                    dto.setFileName(a.get("fileName"));
                    dto.setBase64Data(a.get("base64Data"));
                    dto.setMimeType(a.get("mimeType"));
                    return dto;
                }).collect(Collectors.toList());
            }

            String userEmail = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            replyService.sendReply(id, replyBody, attachments, userEmail);
            return ResponseEntity.ok(Map.of("status", "success", "message", "Reply sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to send reply: " + e.getMessage()));
        }
    }

    /**
     * Get reply history for an email
     * GET /api/inbox/{id}/replies
     */
    @GetMapping("/{id}/replies")
    public ResponseEntity<?> getReplies(
        @PathVariable String id,
        @RequestHeader("Authorization") String token) {
        try {
            String userEmail = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            List<EmailReply> replies = replyService.getReplies(id, userEmail);
            List<Map<String, Object>> response = replies.stream().map(r -> Map.of(
                "id",        (Object) r.getId(),
                "replyBody", r.getReplyBody(),
                "sentAt",    r.getSentAt().toString()
            )).collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get reply history: " + e.getMessage()));
        }
    }

    /**
     * Get sent folder — all replies sent by user
     * GET /api/inbox/sent
     */
    @GetMapping("/sent")
    public ResponseEntity<?> getSentEmails(@RequestHeader("Authorization") String token) {
        try {
            String userEmail = jwtUtil.extractEmail(token.replace("Bearer ", ""));
            List<SentDTO> sent = replyService.getSentEmails(userEmail);
            return ResponseEntity.ok(sent);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to get sent emails: " + e.getMessage()));
        }
    }

    // ══════════════════════════════════════════════════════════
    // DTO Converters
    // ══════════════════════════════════════════════════════════

    private EmailListDTO convertToListDTO(Email email) {
        EmailListDTO dto = new EmailListDTO();
        dto.setId(email.getEmailId());
        dto.setFrom(email.getFrom());
        dto.setSubject(email.getSubject());
        String preview = email.getPlainTextBody();
        if (preview == null) preview = "";
        dto.setPreview(preview.substring(0, Math.min(100, preview.length())));
        dto.setDate(email.getReceivedAt());
        dto.setIsRead(email.getIsRead());
        dto.setIsStarred(email.getIsStarred());
        dto.setThreadId(email.getThreadId());
        dto.setIsReplied(email.getIsReplied());
        return dto;
    }

    private EmailDTO convertToDetailDTO(Email email) {
        EmailDTO dto = new EmailDTO();
        dto.setId(email.getEmailId());
        dto.setFrom(email.getFrom());
        dto.setTo(email.getTo());
        dto.setSubject(email.getSubject());
        dto.setBody(email.getBody());
        dto.setDate(email.getReceivedAt());
        dto.setIsRead(email.getIsRead());
        dto.setIsStarred(email.getIsStarred());
        dto.setThreadId(email.getThreadId());
        dto.setIsReplied(email.getIsReplied());
        dto.setRepliedAt(email.getRepliedAt());
        return dto;
    }
}