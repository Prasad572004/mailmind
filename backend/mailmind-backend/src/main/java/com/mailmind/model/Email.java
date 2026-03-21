package com.mailmind.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emails")
public class Email {

    @Id
    private String emailId;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "sender", columnDefinition = "TEXT")
    private String from;

    @Column(name = "recipient", columnDefinition = "TEXT")
    private String to;

    @Column(columnDefinition = "TEXT")
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(columnDefinition = "TEXT")
    private String plainTextBody;

    private String threadId;

    private Boolean isRead    = false;
    private Boolean isStarred = false;
    private Boolean isSpam    = false;
    private Boolean isTrash   = false;

    // ── Smart Reply fields ──────────────────────────────
    private Boolean isReplied = false;
    private LocalDateTime repliedAt;
    // ───────────────────────────────────────────────────

    @Column(columnDefinition = "TEXT")
    private String labels;

    private LocalDateTime receivedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Getters and Setters
    public String getEmailId() { return emailId; }
    public void setEmailId(String emailId) { this.emailId = emailId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }

    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getPlainTextBody() { return plainTextBody; }
    public void setPlainTextBody(String plainTextBody) { this.plainTextBody = plainTextBody; }

    public String getThreadId() { return threadId; }
    public void setThreadId(String threadId) { this.threadId = threadId; }

    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }

    public Boolean getIsStarred() { return isStarred; }
    public void setIsStarred(Boolean isStarred) { this.isStarred = isStarred; }

    public Boolean getIsSpam() { return isSpam; }
    public void setIsSpam(Boolean isSpam) { this.isSpam = isSpam; }

    public Boolean getIsTrash() { return isTrash; }
    public void setIsTrash(Boolean isTrash) { this.isTrash = isTrash; }

    public Boolean getIsReplied() { return isReplied; }
    public void setIsReplied(Boolean isReplied) { this.isReplied = isReplied; }

    public LocalDateTime getRepliedAt() { return repliedAt; }
    public void setRepliedAt(LocalDateTime repliedAt) { this.repliedAt = repliedAt; }

    public String getLabels() { return labels; }
    public void setLabels(String labels) { this.labels = labels; }

    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
 // Add at bottom of class:
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}