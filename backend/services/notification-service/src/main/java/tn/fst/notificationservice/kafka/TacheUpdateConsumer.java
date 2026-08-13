package tn.fst.notificationservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tn.fst.notificationservice.dto.NotificationRequest;
import tn.fst.notificationservice.dto.TacheUpdateEvent;
import tn.fst.notificationservice.entity.NotificationType;
import tn.fst.notificationservice.service.NotificationService;

@Component
@RequiredArgsConstructor
@Slf4j
public class TacheUpdateConsumer {

    private static final String TACHE_UPDATED_TOPIC = "tache-updated";

    private final NotificationService notificationService;

    @KafkaListener(topics = TACHE_UPDATED_TOPIC, containerFactory = "tacheUpdateKafkaListenerContainerFactory")
    public void consumeTacheUpdated(TacheUpdateEvent event) {
        if (event == null) {
            log.warn("TacheUpdateEvent est null, message ignore");
            return;
        }

        String orgEmail = event.getOrgEmail();
        if (orgEmail == null || orgEmail.isBlank()) {
            log.warn("Org email manquant pour tache {}, notification non creee", event.getTacheId());
            return;
        }

        String titre = "Tache mise a jour";
        String message = String.format(
                "L'etudiant %s a mis a jour la tache '%s' dans le projet '%s' (progression: %s%%).",
                safe(event.getUpdatedByEmail()),
                safe(event.getTacheTitre()),
                safe(event.getProjetNom()),
                event.getProgression() == null ? "0" : event.getProgression().toString());

        NotificationRequest request = NotificationRequest.builder()
                .userId(orgEmail)
                .titre(titre)
                .message(message)
                .type(NotificationType.INFO)
                .relatedEntityType("TASK")
                .relatedEntityId(event.getTacheId())
                .build();

        notificationService.create(request);
        log.info("Notification org creee pour tache {}", event.getTacheId());
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
