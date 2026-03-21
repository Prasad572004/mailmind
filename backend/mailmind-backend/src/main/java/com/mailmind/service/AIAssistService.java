package com.mailmind.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIAssistService {

    private final AIService aiService;

    /**
     * Supported actions:
     * MORE_FORMAL, MORE_FRIENDLY, SHORTEN, LONGER, GRAMMAR, CONTINUE, TRANSLATE
     */
    public String assist(String text, String action, String language) {
        if (text == null || text.isBlank()) {
            throw new RuntimeException("Text cannot be empty");
        }

        String prompt  = buildPrompt(text.trim(), action, language);
        log.info("AI Assist action: {} language: {}", action, language);

        String result = aiService.assistText(prompt);

        // Strip any wrapper phrases Groq sometimes adds
        return cleanResult(result);
    }

    // ─────────────────────────────────────────────────────────
    // Strip common Groq wrapper phrases from the result
    // e.g. "Here is the rewritten email:" / "becomes" / "Original:"
    // ─────────────────────────────────────────────────────────
    private String cleanResult(String result) {
        if (result == null) return "";

        String cleaned = result.trim();

        // Remove leading meta-commentary lines like:
        // "Here is the rewritten email:" / "Here's the formal version:" etc.
        String[] lines = cleaned.split("\n", -1);
        int startLine  = 0;

        for (int i = 0; i < Math.min(3, lines.length); i++) {
            String line = lines[i].trim().toLowerCase();
            if (line.isEmpty()) { startLine = i + 1; continue; }
            if (line.startsWith("here is")
                || line.startsWith("here's")
                || line.startsWith("below is")
                || line.startsWith("the following")
                || line.startsWith("rewritten")
                || line.startsWith("translated")
                || line.startsWith("formal version")
                || line.endsWith(":")) {
                startLine = i + 1;
            } else {
                break;
            }
        }

        if (startLine > 0 && startLine < lines.length) {
            StringBuilder sb = new StringBuilder();
            for (int i = startLine; i < lines.length; i++) {
                if (i > startLine) sb.append("\n");
                sb.append(lines[i]);
            }
            cleaned = sb.toString().trim();
        }

        // Remove "becomes" split pattern:
        // "original text\nbecomes\nrewritten text" → keep only after "becomes"
        int becomesIdx = cleaned.toLowerCase().indexOf("\nbecomes\n");
        if (becomesIdx != -1) {
            cleaned = cleaned.substring(becomesIdx + 9).trim();
        }

        // Remove "is rewritten to" split pattern
        int rewrittenIdx = cleaned.toLowerCase().indexOf("is rewritten to");
        if (rewrittenIdx != -1) {
            cleaned = cleaned.substring(rewrittenIdx + 15).trim();
            // Strip leading \n or quotes
            cleaned = cleaned.replaceAll("^[\\n\"']+", "").trim();
        }

        return cleaned;
    }

    private String buildPrompt(String text, String action, String language) {
        // Shared instruction appended to every prompt
        String strictInstruction = """
                
                STRICT RULES:
                - Return ONLY the email text itself
                - Do NOT include any explanation, label, heading, or meta-commentary
                - Do NOT write "Here is...", "Below is...", "Rewritten:", "becomes", or similar phrases
                - Start directly with the email content (e.g. "Dear..." or subject line)
                """;

        return switch (action.toUpperCase()) {

            case "MORE_FORMAL" -> "Make the following email more formal and professional. "
                + "Keep all key information exactly the same — only adjust the language to be more formal."
                + strictInstruction
                + "\nEmail:\n" + text;

            case "MORE_FRIENDLY" -> "Make the following email warmer, more approachable and friendly. "
                + "Keep all key information exactly the same — only adjust the language to feel friendlier."
                + strictInstruction
                + "\nEmail:\n" + text;

            case "SHORTEN" -> "Shorten the following email. Keep only the most important points. "
                + "Make it concise and clear. Remove unnecessary words and sentences."
                + strictInstruction
                + "\nEmail:\n" + text;

            case "LONGER" -> "Expand the following email to be more detailed and comprehensive. "
                + "Add relevant context, explanation, or supporting details naturally. "
                + "Keep the same tone and purpose."
                + strictInstruction
                + "\nEmail:\n" + text;

            case "GRAMMAR" -> "Fix all grammar, spelling, and punctuation errors in the following email. "
                + "Do not change the tone or meaning."
                + strictInstruction
                + "\nEmail:\n" + text;

            case "CONTINUE" -> "Continue writing the following unfinished email naturally. "
                + "Match the existing tone and style. "
                + "Return the COMPLETE email (original text + your continuation)."
                + strictInstruction
                + "\nEmail so far:\n" + text;

            case "TRANSLATE" -> {
                String lang = (language != null && !language.isBlank()) ? language : "Hindi";
                yield "Translate the following email to " + lang + ". "
                    + "Keep the same tone and formatting."
                    + strictInstruction
                    + "\nEmail:\n" + text;
            }

            default -> throw new RuntimeException("Unknown action: " + action);
        };
    }
}