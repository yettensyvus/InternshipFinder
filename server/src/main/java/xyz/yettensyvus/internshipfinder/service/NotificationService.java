package xyz.yettensyvus.internshipfinder.service;

import xyz.yettensyvus.internshipfinder.dto.NotificationCreateRequest;
import xyz.yettensyvus.internshipfinder.dto.NotificationDTO;
import xyz.yettensyvus.internshipfinder.enums.NotificationType;
import xyz.yettensyvus.internshipfinder.model.Notification;
import xyz.yettensyvus.internshipfinder.model.User;

import java.time.Instant;
import java.util.List;

public interface NotificationService {

    List<NotificationDTO> listForUserFiltered(
            String email,
            NotificationType type,
            Boolean read,
            String actorEmail,
            Long jobId,
            Long applicationId,
            Instant from,
            Instant to
    );

    List<NotificationDTO> listForUser(String email);

    long unreadCount(String email);

    NotificationDTO createForUser(String email, NotificationCreateRequest req);

    Notification createForUserEntity(
            User recipient,
            NotificationType type,
            String title,
            String message,
            String actorEmail,
            Long jobId,
            Long applicationId
    );

    List<Notification> createForAdmins(
            NotificationType type,
            String title,
            String message,
            String actorEmail,
            Long jobId,
            Long applicationId
    );

    void markRead(String email, Long notificationId);

    void markAllRead(String email);

    void clearAll(String email);
}
