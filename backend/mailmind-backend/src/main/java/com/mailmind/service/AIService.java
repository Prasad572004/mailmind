//package com.mailmind.service;
//
//import com.fasterxml.jackson.databind.JsonNode;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.MediaType;
//import org.springframework.stereotype.Service;
//import org.springframework.web.reactive.function.client.WebClient;
//import org.springframework.web.reactive.function.client.WebClientResponseException;
//import java.util.*;
//
//@Service
//@RequiredArgsConstructor
//@Slf4j
//public class AIService {
//
//    @Value("${groq.api.key}")
//    private String groqApiKey;
//
//    @Value("${groq.api.url}")
//    private String groqApiUrl;
//
//    @Value("${groq.model}")
//    private String groqModel;
//
//    private final ObjectMapper objectMapper;
//
//    // =====================================================
//    // GENERATE EMAIL CAMPAIGNS (5 variations)
//    // =====================================================
//    public List<Map<String, Object>> generateEmailVariations(String roughIdea) {
//        String prompt = "You are an expert email copywriter. Generate exactly 5 email variations for this campaign idea: "
//                + roughIdea
//                + "\n\nGenerate one email for each tone: PROFESSIONAL, CASUAL, FRIENDLY, URGENT, PERSUASIVE."
//                + "\n\nRespond ONLY with a valid JSON array. No explanation, no markdown, no extra text. Just the JSON array:"
//                + "\n[{\"tone\":\"PROFESSIONAL\",\"subjectLine\":\"subject here\",\"body\":\"email body here\",\"predictedOpenRate\":0.35},"
//                + "{\"tone\":\"CASUAL\",\"subjectLine\":\"subject here\",\"body\":\"email body here\",\"predictedOpenRate\":0.30},"
//                + "{\"tone\":\"FRIENDLY\",\"subjectLine\":\"subject here\",\"body\":\"email body here\",\"predictedOpenRate\":0.28},"
//                + "{\"tone\":\"URGENT\",\"subjectLine\":\"subject here\",\"body\":\"email body here\",\"predictedOpenRate\":0.40},"
//                + "{\"tone\":\"PERSUASIVE\",\"subjectLine\":\"subject here\",\"body\":\"email body here\",\"predictedOpenRate\":0.38}]";
//
//        String response = callGroqAPI(prompt);
//        return parseJsonArray(response);
//    }
//
//    // =====================================================
//    // SMART REPLY
//    // =====================================================
//    public List<Map<String, Object>> generateSmartReplies(String originalEmail,
//                                                           String originalSubject,
//                                                           String senderEmail) {
//        String prompt = "You are an email assistant. Generate exactly 4 reply options for this email."
//                + "\nFrom: " + senderEmail
//                + "\nSubject: " + originalSubject
//                + "\nEmail: " + originalEmail
//                + "\n\nGenerate replies for tones: PROFESSIONAL, CASUAL, FRIENDLY, BRIEF."
//                + "\n\nRespond ONLY with a valid JSON array. No explanation, no markdown:"
//                + "\n[{\"tone\":\"PROFESSIONAL\",\"replySubject\":\"Re: subject\",\"replyBody\":\"reply here\"},"
//                + "{\"tone\":\"CASUAL\",\"replySubject\":\"Re: subject\",\"replyBody\":\"reply here\"},"
//                + "{\"tone\":\"FRIENDLY\",\"replySubject\":\"Re: subject\",\"replyBody\":\"reply here\"},"
//                + "{\"tone\":\"BRIEF\",\"replySubject\":\"Re: subject\",\"replyBody\":\"reply here\"}]";
//
//        String response = callGroqAPI(prompt);
//        return parseJsonArray(response);
//    }
//
//    // =====================================================
//    // CALL GROQ API
//    // =====================================================
//    private String callGroqAPI(String prompt) {
//        try {
//            log.info("Calling Groq API...");
//            log.info("URL: {}", groqApiUrl);
//            log.info("Model: {}", groqModel);
//            log.info("API Key starts with: {}", groqApiKey != null ? groqApiKey.substring(0, 8) + "..." : "NULL");
//
//            WebClient client = WebClient.builder()
//                    .baseUrl(groqApiUrl)
//                    .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
//                    .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + groqApiKey)
//                    .build();
//
//            // Build request — OpenAI compatible format
//            Map<String, Object> requestBody = new LinkedHashMap<>();
//            requestBody.put("model", groqModel);
//            requestBody.put("max_tokens", 2048);
//            requestBody.put("temperature", 0.7);
//
//            List<Map<String, String>> messages = new ArrayList<>();
//            Map<String, String> userMsg = new LinkedHashMap<>();
//            userMsg.put("role", "user");
//            userMsg.put("content", prompt);
//            messages.add(userMsg);
//            requestBody.put("messages", messages);
//
//            log.info("Sending request to Groq...");
//
//            String response = client.post()
//                    .bodyValue(requestBody)
//                    .retrieve()
//                    .bodyToMono(String.class)
//                    .block();
//
//            log.info("Groq response received!");
//
//            JsonNode jsonNode = objectMapper.readTree(response);
//            String content = jsonNode
//                    .get("choices")
//                    .get(0)
//                    .get("message")
//                    .get("content")
//                    .asText();
//
//            log.info("AI content preview: {}", content.substring(0, Math.min(100, content.length())));
//            return content;
//
//        } catch (WebClientResponseException e) {
//            // ← This shows the EXACT Groq error message
//            log.error("Groq Error Status: {}", e.getStatusCode());
//            log.error("Groq Error Body: {}", e.getResponseBodyAsString());
//            throw new RuntimeException("AI Error: " + e.getStatusCode() + " | " + e.getResponseBodyAsString());
//        } catch (Exception e) {
//            log.error("Unexpected error: {}", e.getMessage(), e);
//            throw new RuntimeException("AI Service Error: " + e.getMessage());
//        }
//    }
//
//    // =====================================================
//    // PARSE JSON ARRAY
//    // =====================================================
//    @SuppressWarnings("unchecked")
//    private List<Map<String, Object>> parseJsonArray(String jsonText) {
//        try {
//            String cleaned = jsonText
//                    .replaceAll("```json", "")
//                    .replaceAll("```", "")
//                    .trim();
//
//            int start = cleaned.indexOf("[");
//            int end = cleaned.lastIndexOf("]") + 1;
//            if (start != -1 && end > start) {
//                cleaned = cleaned.substring(start, end);
//            }
//
//            return objectMapper.readValue(cleaned, List.class);
//
//        } catch (Exception e) {
//            log.error("Error parsing AI response: {}", e.getMessage());
//            log.error("Raw response: {}", jsonText);
//            throw new RuntimeException("Failed to parse AI response: " + e.getMessage());
//        }
//    }
//}

package com.mailmind.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
//import org.springframework.http.HttpEntity;
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;
import java.util.ArrayList;
import java.util.LinkedHashMap;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.model}")
    private String groqModel;

    private final ObjectMapper objectMapper;

    // =====================================================
    // GENERATE EMAIL CAMPAIGNS (5 variations)
    // =====================================================
    public List<Map<String, Object>> generateEmailVariations(String roughIdea) {
        String prompt = "You are an expert email copywriter. Generate exactly 5 email variations for this campaign idea: "
                + roughIdea
                + "\n\nGenerate one email for each tone: PROFESSIONAL, CASUAL, FRIENDLY, URGENT, PERSUASIVE."
                + "\n\nRespond ONLY with a valid JSON array. No explanation, no markdown, no extra text. Just the JSON array:"
                + "\n[{\"tone\":\"PROFESSIONAL\",\"subjectLine\":\"subject here\",\"body\":\"email body here\",\"predictedOpenRate\":0.35},"
                + "{\"tone\":\"CASUAL\",\"subjectLine\":\"subject here\",\"body\":\"email body here\",\"predictedOpenRate\":0.30},"
                + "{\"tone\":\"FRIENDLY\",\"subjectLine\":\"subject here\",\"body\":\"email body here\",\"predictedOpenRate\":0.28},"
                + "{\"tone\":\"URGENT\",\"subjectLine\":\"subject here\",\"body\":\"email body here\",\"predictedOpenRate\":0.40},"
                + "{\"tone\":\"PERSUASIVE\",\"subjectLine\":\"subject here\",\"body\":\"email body here\",\"predictedOpenRate\":0.38}]";

        return parseJsonArray(callGroqAPI(prompt));
    }

    // =====================================================
    // SMART REPLY
    // =====================================================
    public List<Map<String, Object>> generateSmartReplies(String originalEmail,
                                                           String originalSubject,
                                                           String senderEmail) {
        String prompt = "You are an email assistant. Generate exactly 4 reply options for this email."
                + "\nFrom: " + senderEmail
                + "\nSubject: " + originalSubject
                + "\nEmail: " + originalEmail
                + "\n\nGenerate replies for tones: PROFESSIONAL, CASUAL, FRIENDLY, BRIEF."
                + "\n\nRespond ONLY with a valid JSON array. No explanation, no markdown:"
                + "\n[{\"tone\":\"PROFESSIONAL\",\"replySubject\":\"Re: subject\",\"replyBody\":\"reply here\"},"
                + "{\"tone\":\"CASUAL\",\"replySubject\":\"Re: subject\",\"replyBody\":\"reply here\"},"
                + "{\"tone\":\"FRIENDLY\",\"replySubject\":\"Re: subject\",\"replyBody\":\"reply here\"},"
                + "{\"tone\":\"BRIEF\",\"replySubject\":\"Re: subject\",\"replyBody\":\"reply here\"}]";

        return parseJsonArray(callGroqAPI(prompt));
    }

    // =====================================================
    // AI WRITING ASSIST — returns plain text (not JSON)
    // =====================================================
    public String assistText(String prompt) {
        return callGroqAPI(prompt);
    }

  
    // Updated callGroqAPI using RestTemplate instead of WebClient for simplicity
    private final RestTemplate restTemplate;

    private String callGroqAPI(String prompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + groqApiKey);

            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", groqModel);
            requestBody.put("max_tokens", 2048);
            requestBody.put("temperature", 0.7);

            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> userMsg = new LinkedHashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", prompt);
            messages.add(userMsg);
            requestBody.put("messages", messages);

            HttpEntity<Map<String, Object>> request =
                new HttpEntity<>(requestBody, headers);

            String response = restTemplate.postForObject(
                groqApiUrl, request, String.class);

            JsonNode jsonNode = objectMapper.readTree(response);
            return jsonNode.get("choices").get(0)
                    .get("message").get("content").asText();

        } catch (Exception e) {
            log.error("Groq API error: {}", e.getMessage());
            throw new RuntimeException("AI Service Error: " + e.getMessage());
        }
    }

    // =====================================================
    // PARSE JSON ARRAY
    // =====================================================
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> parseJsonArray(String jsonText) {
        try {
            String cleaned = jsonText
                    .replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            int start = cleaned.indexOf("[");
            int end   = cleaned.lastIndexOf("]") + 1;
            if (start != -1 && end > start) {
                cleaned = cleaned.substring(start, end);
            }

            return objectMapper.readValue(cleaned, List.class);

        } catch (Exception e) {
            log.error("Error parsing AI response: {}", e.getMessage());
            throw new RuntimeException("Failed to parse AI response: " + e.getMessage());
        }
    }
}