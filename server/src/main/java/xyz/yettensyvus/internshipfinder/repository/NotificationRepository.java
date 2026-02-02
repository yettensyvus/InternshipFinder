package xyz.yettensyvus.internshipfinder.repository;

import xyz.yettensyvus.internshipfinder.model.Notification;
import xyz.yettensyvus.internshipfinder.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    List<Notification> findByUserAndCreatedAtBetweenOrderByCreatedAtDesc(User user, Instant from, Instant to);
    long countByUserAndReadFalse(User user);
    @Modifying
    @Transactional
    void deleteByUser(User user);
}
