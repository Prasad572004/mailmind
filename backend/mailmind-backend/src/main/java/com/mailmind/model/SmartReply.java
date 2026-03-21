package com.mailmind.model;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "smart_replies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SmartReply {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "original_email", columnDefinition = "TEXT")
    private String originalEmail;

    @Column(name = "original_subject")
    private String originalSubject;

    @Column(name = "sender_email")
    private String senderEmail;

    private String tone;

    @Column(name = "reply_subject")
    private String replySubject;

    @Column(name = "reply_body", columnDefinition = "TEXT")
    private String replyBody;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @JsonIgnoreProperties({"campaigns", "password"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}