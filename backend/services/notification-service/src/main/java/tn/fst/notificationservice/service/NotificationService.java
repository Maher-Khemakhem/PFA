package tn.fst.notificationservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.fst.notificationservice.dto.NotificationRequest;
import tn.fst.notificationservice.dto.NotificationResponse;
import tn.fst.notificationservice.entity.Notification;
import tn.fst.notificationservice.repository.NotificationRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final tn.fst.notificationservice.websocket.NotificationWebSocketService webSocketService;

    public NotificationResponse create(NotificationRequest request) {
        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .titre(request.getTitre())
                .message(request.getMessage())
                .type(request.getType())
                .timestamp(LocalDateTime.now())
                .lu(false)
                .relatedEntityType(request.getRelatedEntityType())
                .relatedEntityId(request.getRelatedEntityId())
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationResponse response = toResponse(saved);
        webSocketService.sendToUser(response.getUserId(), response);
        return response;
    }

    public List<NotificationResponse> getByUserId(String userId) {
        return notificationRepository.findByUserIdOrderByTimestampDesc(userId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<NotificationResponse> getUnreadByUserId(String userId) {
        return notificationRepository.findByUserIdAndLuOrderByTimestampDesc(userId, false)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public long countUnread(String userId) {
        return notificationRepository.countByUserIdAndLu(userId, false);
    }

    public NotificationResponse markAsRead(String id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification non trouvée avec l'id: " + id));

        notification.setLu(true);
        Notification updated = notificationRepository.save(notification);
        return toResponse(updated);
    }

    public void markAllAsRead(String userId) {
        List<Notification> notifications = notificationRepository.findByUserIdAndLuOrderByTimestampDesc(userId, false);
        notifications.forEach(notification -> notification.setLu(true));
        notificationRepository.saveAll(notifications);
    }

    public void delete(String id) {
        if (!notificationRepository.existsById(id)) {
            throw new RuntimeException("Notification non trouvée avec l'id: " + id);
        }
        notificationRepository.deleteById(id);
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .titre(notification.getTitre())
                .message(notification.getMessage())
                .type(notification.getType())
                .timestamp(notification.getTimestamp())
                .lu(notification.isLu())
                .relatedEntityType(notification.getRelatedEntityType())
                .relatedEntityId(notification.getRelatedEntityId())
                .build();
    }
}
