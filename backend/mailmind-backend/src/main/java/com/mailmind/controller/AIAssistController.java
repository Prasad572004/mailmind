package com.mailmind.controller;

import com.mailmind.service.AIAssistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AIAssistController {

    private final AIAssistService aiAssistService;

    /**
     * AI Writing Assistant
     * POST /api/ai/assist
     * Body: { "text": "...", "action": "PROFESSIONAL|CASUAL|SHORTEN|GRAMMAR|CONTINUE|TRANSLATE", "language": "Hindi" }
     * Returns: { "result": "improved text" }
     */
    @PostMapping("/assist")
    public ResponseEntity<?> assist(@RequestBody Map<String, String> request) {
        try {
            String text     = request.get("text");
            String action   = request.get("action");
            String language = request.get("language"); // only used for TRANSLATE

            if (text == null || text.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Text is required"
                ));
            }
            if (action == null || action.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Action is required"
                ));
            }

            String result = aiAssistService.assist(text, action, language);

            return ResponseEntity.ok(Map.of("result", result));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "AI assist failed: " + e.getMessage()
            ));
        }
    }
}