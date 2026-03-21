package com.mailmind.controller;

import com.mailmind.service.SmartReplyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/smart-reply")
@RequiredArgsConstructor
public class SmartReplyController {

    private final SmartReplyService smartReplyService;

    // POST - Generate smart replies for an incoming email
    @PostMapping("/generate")
    public ResponseEntity<?> generateReplies(@RequestBody Map<String, String> request,
                                              @AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(smartReplyService.generateReplies(
                    request.get("originalEmail"),
                    request.get("originalSubject"),
                    request.get("senderEmail"),
                    userDetails.getUsername()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // GET - Reply history
    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            return ResponseEntity.ok(smartReplyService.getReplyHistory(userDetails.getUsername()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE - Remove a reply
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReply(@PathVariable Long id,
                                          @AuthenticationPrincipal UserDetails userDetails) {
        try {
            smartReplyService.deleteReply(id, userDetails.getUsername());
            return ResponseEntity.ok(Map.of("message", "Reply deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
