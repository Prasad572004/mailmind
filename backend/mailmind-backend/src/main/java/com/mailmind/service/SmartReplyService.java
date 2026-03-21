package com.mailmind.service;

import com.mailmind.model.SmartReply;
import com.mailmind.model.User;
import com.mailmind.repository.SmartReplyRepository;
import com.mailmind.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SmartReplyService {

    private final SmartReplyRepository smartReplyRepository;
    private final UserRepository userRepository;
    private final AIService aiService;

    // Generate smart replies for an incoming email
    public List<SmartReply> generateReplies(String originalEmail,
                                             String originalSubject,
                                             String senderEmail,
                                             String userEmail) {

        User user = getUserByEmail(userEmail);

        // Call Claude AI to generate replies
        List<Map<String, Object>> replies = aiService.generateSmartReplies(
                originalEmail, originalSubject, senderEmail);

        // Save all generated replies
        List<SmartReply> savedReplies = new ArrayList<>();
        replies.forEach(r -> {
            SmartReply reply = SmartReply.builder()
                    .originalEmail(originalEmail)
                    .originalSubject(originalSubject)
                    .senderEmail(senderEmail)
                    .tone((String) r.get("tone"))
                    .replySubject((String) r.get("replySubject"))
                    .replyBody((String) r.get("replyBody"))
                    .user(user)
                    .build();
            savedReplies.add(smartReplyRepository.save(reply));
        });

        log.info("Generated {} smart replies for user: {}", savedReplies.size(), userEmail);
        return savedReplies;
    }

    // Get reply history for a user
    public List<SmartReply> getReplyHistory(String email) {
        User user = getUserByEmail(email);
        return smartReplyRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    // Delete a reply
    public void deleteReply(Long id, String email) {
        SmartReply reply = smartReplyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reply not found"));
        if (!reply.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Unauthorized");
        }
        smartReplyRepository.delete(reply);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
