package xyz.yettensyvus.internshipfinder.dto;

import lombok.Data;

import xyz.yettensyvus.internshipfinder.enums.NotificationType;

@Data
public class NotificationCreateRequest {
    private String title;
    private String message;
    private NotificationType type;
    private String actorEmail;
    private Long jobId;
    private Long applicationId;
}
