package tn.fst.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.fst.notificationservice.entity.NotificationType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private String id;
    private String userId;
    private String titre;
    private String message;
    private NotificationType type;
    private LocalDateTime timestamp;
    private boolean lu;
    private String relatedEntityType;
    private String relatedEntityId;
}
