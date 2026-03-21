package com.mailmind.dto;

import lombok.Data;

@Data
public class AttachmentDTO {
    private String fileName;   // e.g. "report.pdf"
    private String base64Data; // base64-encoded file content
    private String mimeType;   // e.g. "application/pdf", "image/png"
}