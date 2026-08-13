package tn.fst.notificationservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tn.fst.notificationservice.dto.NotificationRequest;
import tn.fst.notificationservice.dto.TacheAssigneeEvent;
import tn.fst.notificationservice.entity.NotificationType;
import tn.fst.notificationservice.service.NotificationService;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class TacheEventConsumer {

    private static final String TACHE_ASSIGNEE_TOPIC = "tache-assignee";

    private final NotificationService notificationService;

    @KafkaListener(topics = TACHE_ASSIGNEE_TOPIC, containerFactory = "kafkaListenerContainerFactory")
    public void consumeTacheAssignee(TacheAssigneeEvent event) {
        if (event == null) {
            log.warn("TacheAssigneeEvent est null, message ignore");
            return;
        }

        List<String> membres = event.getMembresEmails();
        if (membres == null || membres.isEmpty()) {
            log.warn("Aucun membre pour la tache {}, notification non creee", event.getTacheId());
            return;
        }

        String titre = "Nouvelle tache assignee";
        String message = String.format(
                "Vous avez ete assigne a la tache '%s' dans le projet '%s'.",
                safe(event.getTacheTitre()),
                safe(event.getProjetNom()));

        for (String email : membres) {
            if (email == null || email.isBlank()) {
                continue;
            }

            NotificationRequest request = NotificationRequest.builder()
                    .userId(email)
                    .titre(titre)
                    .message(message)
                    .type(NotificationType.INFO)
                    .relatedEntityType("TASK")
                    .relatedEntityId(event.getTacheId())
                    .build();

            notificationService.create(request);
        }

        log.info("Notifications creees pour tache {} ({} membres)", event.getTacheId(), membres.size());
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
