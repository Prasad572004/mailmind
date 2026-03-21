package com.mailmind.service;

import com.mailmind.model.User;
import com.mailmind.repository.CampaignRepository;
import com.mailmind.repository.EmailRepository;
import com.mailmind.repository.EmailReplyRepository;
import com.mailmind.repository.SmartReplyRepository;
import com.mailmind.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final CampaignRepository   campaignRepository;
    private final SmartReplyRepository smartReplyRepository;
    private final UserRepository       userRepository;
    private final EmailRepository      emailRepository;
    private final EmailReplyRepository emailReplyRepository;

    public Map<String, Object> getDashboardStats(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ── Campaign stats ──────────────────────────────────────
        long totalCampaigns  = campaignRepository.countByUserId(user.getId());
        long activeCampaigns = campaignRepository
                .findByUserIdAndStatus(user.getId(), "ACTIVE").size();
        long draftCampaigns  = campaignRepository
                .findByUserIdAndStatus(user.getId(), "DRAFT").size();
        long sentCampaigns   = campaignRepository
                .findByUserIdAndStatus(user.getId(), "SENT").size();

        // ── Smart reply stats — use COUNT not load all ──────────
        long totalSmartReplies = smartReplyRepository.countByUserId(user.getId());

        // ── Inbox email stats ───────────────────────────────────
        List<com.mailmind.model.Email> allEmails = emailRepository.findInboxEmails(user);
        long totalEmails   = allEmails.size();
        long unreadEmails  = allEmails.stream()
                .filter(e -> Boolean.FALSE.equals(e.getIsRead())).count();
        long repliedEmails = allEmails.stream()
                .filter(e -> Boolean.TRUE.equals(e.getIsReplied())).count();

        // ── Replies sent ────────────────────────────────────────
        long repliesSent = emailReplyRepository.countByUser(user);

        // ── Reply rate ──────────────────────────────────────────
        long notReplied = totalEmails - repliedEmails;
        Map<String, Object> replyRate = new HashMap<>();
        replyRate.put("replied",    repliedEmails);
        replyRate.put("notReplied", Math.max(0, notReplied));

        // ── Emails per day — last 7 days ────────────────────────
        List<Map<String, Object>> emailsPerDay = buildEmailsPerDay(allEmails);

        // ── Top 5 senders ───────────────────────────────────────
        List<Map<String, Object>> topSenders = buildTopSenders(allEmails);

        // ── Campaign status breakdown ────────────────────────────
        Map<String, Object> campaignsByStatus = new LinkedHashMap<>();
        campaignsByStatus.put("DRAFT",  draftCampaigns);
        campaignsByStatus.put("ACTIVE", activeCampaigns);
        campaignsByStatus.put("SENT",   sentCampaigns);

        // ── Recent campaigns (last 5) ────────────────────────────
        List<Map<String, Object>> recentCampaigns = campaignRepository
                .findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .limit(5)
                .map(c -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id",        c.getId());
                    m.put("title",     c.getTitle());
                    m.put("status",    c.getStatus());
                    m.put("createdAt", c.getCreatedAt() != null
                            ? c.getCreatedAt().toString() : "");
                    return m;
                })
                .collect(Collectors.toList());

        // ── Monthly activity — last 6 months ────────────────────
        List<Map<String, Object>> monthlyActivity = buildMonthlyActivity(allEmails, user);

        // ── Assemble response ────────────────────────────────────
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("userName",          user.getName());
        stats.put("totalEmails",       totalEmails);
        stats.put("unreadEmails",      unreadEmails);
        stats.put("repliesSent",       repliesSent);
        stats.put("repliedEmails",     repliedEmails);
        stats.put("replyRate",         replyRate);
        stats.put("emailsPerDay",      emailsPerDay);
        stats.put("topSenders",        topSenders);
        stats.put("totalCampaigns",    totalCampaigns);
        stats.put("activeCampaigns",   activeCampaigns);
        stats.put("draftCampaigns",    draftCampaigns);
        stats.put("sentCampaigns",     sentCampaigns);
        stats.put("campaignsByStatus", campaignsByStatus);
        stats.put("recentCampaigns",   recentCampaigns);
        stats.put("totalSmartReplies", totalSmartReplies);
        stats.put("monthlyCampaigns",  monthlyActivity);

        return stats;
    }

    private List<Map<String, Object>> buildEmailsPerDay(
            List<com.mailmind.model.Email> emails) {

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM dd");
        LocalDate today = LocalDate.now();

        Map<LocalDate, Long> countMap = emails.stream()
                .filter(e -> e.getReceivedAt() != null)
                .filter(e -> e.getReceivedAt().toLocalDate()
                        .isAfter(today.minusDays(7)))
                .collect(Collectors.groupingBy(
                        e -> e.getReceivedAt().toLocalDate(),
                        Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date",  date.format(fmt));
            entry.put("count", countMap.getOrDefault(date, 0L));
            result.add(entry);
        }
        return result;
    }

    private List<Map<String, Object>> buildTopSenders(
            List<com.mailmind.model.Email> emails) {

        return emails.stream()
                .filter(e -> e.getFrom() != null)
                .collect(Collectors.groupingBy(
                        e -> extractEmailAddress(e.getFrom()),
                        Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(entry -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("sender", entry.getKey());
                    m.put("count",  entry.getValue());
                    return m;
                })
                .collect(Collectors.toList());
    }

    private List<Map<String, Object>> buildMonthlyActivity(
            List<com.mailmind.model.Email> emails, User user) {

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("MMM");
        LocalDate today = LocalDate.now();

        Map<String, Long> emailsPerMonth = emails.stream()
                .filter(e -> e.getReceivedAt() != null)
                .filter(e -> e.getReceivedAt().toLocalDate()
                        .isAfter(today.minusMonths(6)))
                .collect(Collectors.groupingBy(
                        e -> e.getReceivedAt().toLocalDate()
                                .withDayOfMonth(1).format(fmt),
                        Collectors.counting()));

        // Use count query instead of loading all replies
        List<com.mailmind.model.EmailReply> recentReplies =
                emailReplyRepository.findByUserAndSentAtAfter(
                        user, today.minusMonths(6).atStartOfDay());

        Map<String, Long> repliesPerMonth = recentReplies.stream()
                .filter(r -> r.getSentAt() != null)
                .collect(Collectors.groupingBy(
                        r -> r.getSentAt().toLocalDate()
                                .withDayOfMonth(1).format(fmt),
                        Collectors.counting()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate month = today.minusMonths(i).withDayOfMonth(1);
            String label = month.format(fmt);
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("month",   label);
            entry.put("emails",  emailsPerMonth.getOrDefault(label, 0L));
            entry.put("replies", repliesPerMonth.getOrDefault(label, 0L));
            result.add(entry);
        }
        return result;
    }

    private String extractEmailAddress(String from) {
        if (from != null && from.contains("<") && from.contains(">")) {
            return from.substring(from.indexOf("<") + 1, from.indexOf(">")).trim();
        }
        return from != null ? from : "Unknown";
    }
}