package com.mailmind.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SentDTO {
    private Long id;
    private String originalEmailId;
    private String originalSubject;
    private String originalFrom;
    private String replyBody;
    private LocalDateTime sentAt;
}