package xyz.yettensyvus.internshipfinder.dto;

import lombok.Data;

import xyz.yettensyvus.internshipfinder.enums.NotificationType;

import java.time.Instant;

@Data
public class NotificationDTO {
    private Long id;
    private String title;
    private String message;
    private NotificationType type;
    private String actorEmail;
    private Long jobId;
    private Long applicationId;
    private boolean read;
    private Instant createdAt;
}
