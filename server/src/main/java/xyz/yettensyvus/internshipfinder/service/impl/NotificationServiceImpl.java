package xyz.yettensyvus.internshipfinder.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.yettensyvus.internshipfinder.dto.NotificationCreateRequest;
import xyz.yettensyvus.internshipfinder.dto.NotificationDTO;
import xyz.yettensyvus.internshipfinder.enums.NotificationType;
import xyz.yettensyvus.internshipfinder.enums.Role;
import xyz.yettensyvus.internshipfinder.model.Notification;
import xyz.yettensyvus.internshipfinder.model.User;
import xyz.yettensyvus.internshipfinder.repository.NotificationRepository;
import xyz.yettensyvus.internshipfinder.repository.UserRepository;
import xyz.yettensyvus.internshipfinder.service.NotificationService;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private static NotificationDTO toDto(Notification n) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(n.getId());
        dto.setTitle(n.getTitle());
        dto.setMessage(n.getMessage());
        dto.setType(n.getType());
        dto.setActorEmail(n.getActorEmail());
        dto.setJobId(n.getJobId());
        dto.setApplicationId(n.getApplicationId());
        dto.setRead(n.isRead());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }

    @Override
    public List<NotificationDTO> listForUserFiltered(
            String email,
            NotificationType type,
            Boolean read,
            String actorEmail,
            Long jobId,
            Long applicationId,
            Instant from,
            Instant to
    ) {
        User user = getUserByEmail(email);

        List<Notification> base;
        if (from != null && to != null) {
            base = notificationRepository.findByUserAndCreatedAtBetweenOrderByCreatedAtDesc(user, from, to);
        } else {
            base = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        }

        return base.stream()
                .filter(n -> type == null || n.getType() == type)
                .filter(n -> read == null || n.isRead() == read)
                .filter(n -> actorEmail == null || actorEmail.isBlank() || (n.getActorEmail() != null && n.getActorEmail().equalsIgnoreCase(actorEmail)))
                .filter(n -> jobId == null || (n.getJobId() != null && n.getJobId().equals(jobId)))
                .filter(n -> applicationId == null || (n.getApplicationId() != null && n.getApplicationId().equals(applicationId)))
                .map(NotificationServiceImpl::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> listForUser(String email) {
        User user = getUserByEmail(email);
        return notificationRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(NotificationServiceImpl::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public long unreadCount(String email) {
        User user = getUserByEmail(email);
        return notificationRepository.countByUserAndReadFalse(user);
    }

    @Override
    public NotificationDTO createForUser(String email, NotificationCreateRequest req) {
        User user = getUserByEmail(email);

        String title = req.getTitle() == null ? "Notification" : req.getTitle().trim();
        String message = req.getMessage() == null ? "" : req.getMessage().trim();

        if (title.isEmpty()) {
            title = "Notification";
        }

        Notification n = new Notification();
        n.setUser(user);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(req.getType() == null ? NotificationType.GENERIC : req.getType());
        n.setActorEmail(req.getActorEmail());
        n.setJobId(req.getJobId());
        n.setApplicationId(req.getApplicationId());
        n.setRead(false);

        return toDto(notificationRepository.save(n));
    }

    @Override
    public Notification createForUserEntity(
            User recipient,
            NotificationType type,
            String title,
            String message,
            String actorEmail,
            Long jobId,
            Long applicationId
    ) {
        Notification n = new Notification();
        n.setUser(recipient);
        n.setType(type == null ? NotificationType.GENERIC : type);
        n.setTitle(title == null || title.isBlank() ? "Notification" : title);
        n.setMessage(message == null ? "" : message);
        n.setActorEmail(actorEmail);
        n.setJobId(jobId);
        n.setApplicationId(applicationId);
        n.setRead(false);
        return notificationRepository.save(n);
    }

    @Override
    public List<Notification> createForAdmins(
            NotificationType type,
            String title,
            String message,
            String actorEmail,
            Long jobId,
            Long applicationId
    ) {
        List<User> admins = userRepository.findByRole(Role.ADMIN);
        List<Notification> created = new ArrayList<>();
        for (User admin : admins) {
            created.add(createForUserEntity(admin, type, title, message, actorEmail, jobId, applicationId));
        }
        return created;
    }

    @Override
    public void markRead(String email, Long notificationId) {
        User user = getUserByEmail(email);
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (n.getUser() == null || n.getUser().getId() == null || !n.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not allowed");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Override
    public void markAllRead(String email) {
        User user = getUserByEmail(email);
        List<Notification> list = notificationRepository.findByUserOrderByCreatedAtDesc(user);
        for (Notification n : list) {
            if (!n.isRead()) {
                n.setRead(true);
            }
        }
        notificationRepository.saveAll(list);
    }

    @Override
    @Transactional
    public void clearAll(String email) {
        User user = getUserByEmail(email);
        notificationRepository.deleteByUser(user);
    }
}
