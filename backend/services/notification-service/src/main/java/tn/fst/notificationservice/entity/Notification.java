package tn.fst.notificationservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    private String id;

    private String userId; // email of recipient

    private String titre;

    private String message;

    private NotificationType type; // INFO, SUCCESS, WARNING, ERROR

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    @Builder.Default
    private boolean lu = false; // read status

    private String relatedEntityType; // PROJECT, TASK, EVENT

    private String relatedEntityId;
}
