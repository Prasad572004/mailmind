package com.mailmind.dto;

import java.util.List;

import lombok.Data;
@Data
public class SendEmailRequest {
    private List<String> to;
    private String subject;
    private String body;
    private String campaignId;          // optional, for tracking

    // Optional file attachments — null or empty means no attachments
    private List<AttachmentDTO> attachments;

    // Getters and Setters
    public List<String> getTo() { return to; }
    public void setTo(List<String> to) { this.to = to; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getCampaignId() { return campaignId; }
    public void setCampaignId(String campaignId) { this.campaignId = campaignId; }

    public List<AttachmentDTO> getAttachments() { return attachments; }
    public void setAttachments(List<AttachmentDTO> attachments) { this.attachments = attachments; }
}