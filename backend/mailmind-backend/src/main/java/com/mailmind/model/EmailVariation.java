package com.mailmind.model;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "email_variations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVariation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String tone;

    @Column(name = "subject_line")
    private String subjectLine;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "predicted_open_rate")
    private Double predictedOpenRate;

    @Column(name = "is_selected")
    private Boolean isSelected;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @JsonIgnoreProperties({"emailVariations", "user"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id")
    private Campaign campaign;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.isSelected == null) this.isSelected = false;
    }
}