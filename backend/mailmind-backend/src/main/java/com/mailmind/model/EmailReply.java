package com.mailmind.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_replies")
public class EmailReply {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Which email this reply belongs to (FK to emails.email_id)
    @Column(nullable = false)
    private String emailId;

    // Which user sent this reply
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // The reply text that was sent
    @Column(columnDefinition = "TEXT", nullable = false)
    private String replyBody;

    // When the reply was sent
    @Column(nullable = false)
    private LocalDateTime sentAt = LocalDateTime.now();

    // ── Getters and Setters ──────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmailId() { return emailId; }
    public void setEmailId(String emailId) { this.emailId = emailId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getReplyBody() { return replyBody; }
    public void setReplyBody(String replyBody) { this.replyBody = replyBody; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
}