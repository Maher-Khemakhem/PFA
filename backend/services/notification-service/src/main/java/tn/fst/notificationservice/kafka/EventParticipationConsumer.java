package tn.fst.notificationservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tn.fst.notificationservice.dto.EventParticipationEvent;
import tn.fst.notificationservice.dto.NotificationRequest;
import tn.fst.notificationservice.entity.NotificationType;
import tn.fst.notificationservice.service.NotificationService;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventParticipationConsumer {

    private static final String EVENT_PARTICIPATION_TOPIC = "event-participation";

    private final NotificationService notificationService;

    @KafkaListener(topics = EVENT_PARTICIPATION_TOPIC, containerFactory = "eventParticipationKafkaListenerContainerFactory")
    public void consumeEventParticipation(EventParticipationEvent event) {
        if (event == null) {
            log.warn("EventParticipationEvent est null, message ignore");
            return;
        }

        String organizerEmail = event.getOrganizerEmail();
        if (organizerEmail == null || organizerEmail.isBlank()) {
            log.warn("Organisateur manquant pour l'evenement {}, notification non creee", event.getEventId());
            return;
        }

        String titre = "Nouvelle participation a un evenement";
        String message = String.format(
                "Le membre %s a rejoint l'evenement '%s'.",
                safe(event.getParticipantEmail()),
                safe(event.getEventTitle()));

        NotificationRequest request = NotificationRequest.builder()
                .userId(organizerEmail)
                .titre(titre)
                .message(message)
                .type(NotificationType.INFO)
                .relatedEntityType("EVENT")
                .relatedEntityId(event.getEventId())
                .build();

        notificationService.create(request);
        log.info("Notification de participation evenement creee pour event {}", event.getEventId());
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}