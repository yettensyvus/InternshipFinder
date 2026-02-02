package xyz.yettensyvus.internshipfinder.controller;

import xyz.yettensyvus.internshipfinder.dto.NotificationCreateRequest;
import xyz.yettensyvus.internshipfinder.dto.NotificationDTO;
import xyz.yettensyvus.internshipfinder.enums.NotificationType;
import xyz.yettensyvus.internshipfinder.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> list(
            Principal principal,
            @RequestParam(required = false) NotificationType type,
            @RequestParam(required = false) Boolean read,
            @RequestParam(required = false) String actorEmail,
            @RequestParam(required = false) Long jobId,
            @RequestParam(required = false) Long applicationId,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        Instant fromInstant = null;
        Instant toInstant = null;

        if (from != null && !from.isBlank()) {
            fromInstant = Instant.parse(from);
        }
        if (to != null && !to.isBlank()) {
            toInstant = Instant.parse(to);
        }

        return ResponseEntity.ok(notificationService.listForUserFiltered(
                principal.getName(),
                type,
                read,
                actorEmail,
                jobId,
                applicationId,
                fromInstant,
                toInstant
        ));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(Principal principal) {
        long count = notificationService.unreadCount(principal.getName());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PostMapping
    public ResponseEntity<NotificationDTO> create(@RequestBody NotificationCreateRequest request, Principal principal) {
        return ResponseEntity.ok(notificationService.createForUser(principal.getName(), request));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<String> markRead(@PathVariable Long id, Principal principal) {
        notificationService.markRead(principal.getName(), id);
        return ResponseEntity.ok("OK");
    }

    @PutMapping("/read-all")
    public ResponseEntity<String> markAllRead(Principal principal) {
        notificationService.markAllRead(principal.getName());
        return ResponseEntity.ok("OK");
    }

    @DeleteMapping
    public ResponseEntity<String> clearAll(Principal principal) {
        notificationService.clearAll(principal.getName());
        return ResponseEntity.ok("OK");
    }
}
