package com.mailmind.service;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mailmind.model.Email;
import com.mailmind.model.User;
import com.mailmind.repository.EmailRepository;
import com.mailmind.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class GmailSyncService {

    private final EmailRepository      emailRepository;
    private final UserRepository       userRepository;
    private final RestTemplate         restTemplate;
    private final GoogleOAuthService   googleOAuthService;

    private static final String GMAIL_API_BASE = "https://www.googleapis.com/gmail/v1/users/me";

    // ─────────────────────────────────────────────────────────
    // Public entry point — syncs inbox emails for a user
    // ─────────────────────────────────────────────────────────
    public void syncEmails(User user) throws Exception {
        if (user.getGmailAccessToken() == null) {
            throw new RuntimeException("Gmail account not connected. Please reconnect.");
        }

        // Refresh token if expired before starting sync
        String accessToken = getValidAccessToken(user);

        try {
            String listUrl   = GMAIL_API_BASE + "/messages?maxResults=50&q=in:inbox";
            String response  = gmailGet(listUrl, accessToken);

            JsonObject jsonObject = JsonParser.parseString(response).getAsJsonObject();
            JsonArray  messages   = jsonObject.getAsJsonArray("messages");

            if (messages != null && messages.size() > 0) {
                log.info("Syncing {} emails for user {}", messages.size(), user.getEmail());
                for (int i = 0; i < messages.size(); i++) {
                    String messageId = messages.get(i).getAsJsonObject()
                            .get("id").getAsString();
                    syncSingleEmail(user, messageId, accessToken);
                }
            } else {
                log.info("No new emails to sync for user {}", user.getEmail());
            }

        } catch (HttpClientErrorException.Unauthorized e) {
            // Token was valid at start but expired mid-sync — refresh and retry once
            log.warn("Token expired during sync, refreshing and retrying...");
            String newToken = refreshAndSaveToken(user);
            retrySyncAfterRefresh(user, newToken);

        } catch (Exception e) {
            log.error("Failed to sync emails: {}", e.getMessage());
            throw e;
        }
    }

    // ─────────────────────────────────────────────────────────
    // Retry sync once after a mid-sync token refresh
    // ─────────────────────────────────────────────────────────
    private void retrySyncAfterRefresh(User user, String accessToken) throws Exception {
        String listUrl  = GMAIL_API_BASE + "/messages?maxResults=50&q=in:inbox";
        String response = gmailGet(listUrl, accessToken);

        JsonObject jsonObject = JsonParser.parseString(response).getAsJsonObject();
        JsonArray  messages   = jsonObject.getAsJsonArray("messages");

        if (messages != null && messages.size() > 0) {
            for (int i = 0; i < messages.size(); i++) {
                String messageId = messages.get(i).getAsJsonObject()
                        .get("id").getAsString();
                syncSingleEmail(user, messageId, accessToken);
            }
        }
    }

    // ─────────────────────────────────────────────────────────
    // Sync a single email by message ID
    // ─────────────────────────────────────────────────────────
    private void syncSingleEmail(User user, String messageId,
                                  String accessToken) throws Exception {
        // Skip if already synced
        Optional<Email> existing = emailRepository.findByUserAndEmailId(user, messageId);
        if (existing.isPresent()) return;

        try {
            String messageUrl = GMAIL_API_BASE + "/messages/" + messageId + "?format=full";
            String response   = gmailGet(messageUrl, accessToken);

            JsonObject msgObject = JsonParser.parseString(response).getAsJsonObject();
            Email email = parseGmailMessage(user, msgObject);
            emailRepository.save(email);

        } catch (Exception e) {
            // Don't fail the whole sync for one bad message
            log.warn("Failed to sync email {}: {}", messageId, e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────
    // Make a GET request to Gmail API using Authorization header
    // (NOT query param — query param is deprecated and causes 401)
    // ─────────────────────────────────────────────────────────
    private String gmailGet(String url, String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);

        HttpEntity<Void> entity   = new HttpEntity<>(headers);
        ResponseEntity<String> res = restTemplate.exchange(
                url, HttpMethod.GET, entity, String.class);

        return res.getBody();
    }

    // ─────────────────────────────────────────────────────────
    // Get valid access token — refresh if expired
    // ─────────────────────────────────────────────────────────
    private String getValidAccessToken(User user) {
        if (user.getGmailTokenExpiresAt() != null) {
            // Add 60-second buffer so we refresh slightly before actual expiry
            long nowPlusBuffer = System.currentTimeMillis() + (60 * 1000);
            if (nowPlusBuffer >= user.getGmailTokenExpiresAt()) {
                log.info("Access token expired or expiring soon, refreshing...");
                return refreshAndSaveToken(user);
            }
        }
        return user.getGmailAccessToken();
    }

    // ─────────────────────────────────────────────────────────
    // Refresh token via Google OAuth and persist to DB
    // ─────────────────────────────────────────────────────────
    private String refreshAndSaveToken(User user) {
        if (user.getGmailRefreshToken() == null) {
            throw new RuntimeException(
                "No refresh token available. Please reconnect your Gmail account.");
        }

        Map<String, Object> tokenResponse =
                googleOAuthService.refreshAccessToken(user.getGmailRefreshToken());

        String newAccessToken = (String) tokenResponse.get("access_token");
        if (newAccessToken == null) {
            throw new RuntimeException(
                "Failed to refresh access token. Please reconnect your Gmail account.");
        }

        // Persist new token and expiry
        user.setGmailAccessToken(newAccessToken);
        Number expiresIn = (Number) tokenResponse.get("expires_in");
        if (expiresIn != null) {
            user.setGmailTokenExpiresAt(
                    System.currentTimeMillis() + (expiresIn.longValue() * 1000));
        }
        userRepository.save(user);

        log.info("Access token refreshed successfully for user {}", user.getEmail());
        return newAccessToken;
    }

    // ─────────────────────────────────────────────────────────
    // Parse Gmail API message into Email entity
    // ─────────────────────────────────────────────────────────
    private Email parseGmailMessage(User user, JsonObject msgObject) {
        Email email = new Email();

        email.setEmailId(msgObject.get("id").getAsString());
        if (msgObject.has("threadId")) {
            email.setThreadId(msgObject.get("threadId").getAsString());
        }
        email.setUser(user);

        JsonObject payload = msgObject.getAsJsonObject("payload");
        JsonArray  headers = payload.getAsJsonArray("headers");

        String from    = null;
        String to      = null;
        String subject = null;
        String dateStr = null;

        if (headers != null) {
            for (int i = 0; i < headers.size(); i++) {
                JsonObject header = headers.get(i).getAsJsonObject();
                String name  = header.get("name").getAsString();
                String value = header.get("value").getAsString();

                switch (name) {
                    case "From"    -> from    = value;
                    case "To"      -> to      = value;
                    case "Subject" -> subject = value;
                    case "Date"    -> dateStr = value;
                }
            }
        }

        email.setFrom(from    != null ? from    : "Unknown");
        email.setTo(to        != null ? to      : "Unknown");
        email.setSubject(subject != null ? subject : "(No Subject)");

        if (dateStr != null) {
            try { email.setReceivedAt(parseEmailDate(dateStr)); }
            catch (Exception e) { email.setReceivedAt(LocalDateTime.now()); }
        } else {
            email.setReceivedAt(LocalDateTime.now());
        }

        String body = extractBody(payload);
        email.setBody(body != null ? body : "");
        email.setPlainTextBody(stripHtml(email.getBody()));

        email.setIsRead(false);
        email.setIsStarred(false);
        email.setIsSpam(false);
        email.setIsTrash(false);

        return email;
    }

    // ─────────────────────────────────────────────────────────
    // Extract email body from payload (recursive for multipart)
    // ─────────────────────────────────────────────────────────
    private String extractBody(JsonObject payload) {
        try {
            String mimeType = payload.get("mimeType").getAsString();

            if ("text/plain".equals(mimeType) || "text/html".equals(mimeType)) {
                if (payload.has("body")) {
                    JsonObject body = payload.getAsJsonObject("body");
                    if (body.has("data")) {
                        return new String(java.util.Base64.getUrlDecoder()
                                .decode(body.get("data").getAsString()));
                    }
                }
            }

            if (mimeType.startsWith("multipart/")) {
                if (payload.has("parts")) {
                    JsonArray parts = payload.getAsJsonArray("parts");
                    // Prefer text/plain, fall back to anything
                    String fallback = null;
                    for (int i = 0; i < parts.size(); i++) {
                        JsonObject part     = parts.get(i).getAsJsonObject();
                        String     partMime = part.has("mimeType")
                                ? part.get("mimeType").getAsString() : "";
                        String     partBody = extractBody(part);
                        if (partBody != null && !partBody.isEmpty()) {
                            if ("text/plain".equals(partMime)) return partBody;
                            fallback = partBody;
                        }
                    }
                    return fallback != null ? fallback : "";
                }
            }
        } catch (Exception e) {
            log.warn("Error extracting body: {}", e.getMessage());
        }
        return "";
    }

    
    //Updated date parsing to handle more formats (some emails have slightly different date formats)
    private LocalDateTime parseEmailDate(String dateStr) {
        try {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern(
                "EEE, d MMM yyyy HH:mm:ss Z", java.util.Locale.US);
            return java.time.ZonedDateTime.parse(dateStr, fmt)
                .withZoneSameInstant(java.time.ZoneOffset.UTC)
                .toLocalDateTime();
        } catch (Exception e) {
            log.warn("Error parsing date '{}': {}", dateStr, e.getMessage());
            return LocalDateTime.now();
        }
    }
    // ─────────────────────────────────────────────────────────
    // Strip HTML tags from body text
    // ─────────────────────────────────────────────────────────
    private String stripHtml(String html) {
        if (html == null || html.isEmpty()) return "";
        return html.replaceAll("<[^>]*>", "")
                   .replaceAll("&nbsp;", " ")
                   .replaceAll("&lt;",   "<")
                   .replaceAll("&gt;",   ">")
                   .replaceAll("&amp;",  "&")
                   .trim();
    }
}