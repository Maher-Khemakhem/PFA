package tn.fst.notificationservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import tn.fst.notificationservice.entity.NotificationType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {

    @NotBlank(message = "L'ID utilisateur est obligatoire")
    private String userId;

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    @NotBlank(message = "Le message est obligatoire")
    private String message;

    @NotNull(message = "Le type est obligatoire")
    private NotificationType type;

    private String relatedEntityType;

    private String relatedEntityId;
}
