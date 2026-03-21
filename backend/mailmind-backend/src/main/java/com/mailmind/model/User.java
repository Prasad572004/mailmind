package com.mailmind.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;


@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @Email
    @NotBlank
    @Column(unique = true)
    private String email;

    @JsonIgnore
    private String password;

    @JsonIgnore
    private String gmailAccessToken;

    @JsonIgnore
    private String gmailRefreshToken;
    private Long gmailTokenExpiresAt;

    // Email relationship - FIXED with @Builder.Default
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("user")
    @Builder.Default
    private List<com.mailmind.model.Email> emails = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Campaigns relationship - FIXED with @Builder.Default
    @JsonIgnoreProperties({"user", "emailVariations"})
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Campaign> campaigns = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}