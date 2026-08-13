package tn.fst.notificationservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.fst.notificationservice.dto.NotificationRequest;
import tn.fst.notificationservice.dto.NotificationResponse;
import tn.fst.notificationservice.service.NotificationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping
    public ResponseEntity<NotificationResponse> createNotification(@Valid @RequestBody NotificationRequest request) {
        NotificationResponse response = notificationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/user/{email}")
    public ResponseEntity<List<NotificationResponse>> getUserNotifications(@PathVariable String email) {
        List<NotificationResponse> notifications = notificationService.getByUserId(email);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/user/{email}/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(@PathVariable String email) {
        List<NotificationResponse> notifications = notificationService.getUnreadByUserId(email);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/user/{email}/unread/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable String email) {
        long count = notificationService.countUnread(email);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable String id) {
        NotificationResponse response = notificationService.markAsRead(id);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/user/{email}/read-all")
    public ResponseEntity<Void> markAllAsRead(@PathVariable String email) {
        notificationService.markAllAsRead(email);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable String id) {
        notificationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
