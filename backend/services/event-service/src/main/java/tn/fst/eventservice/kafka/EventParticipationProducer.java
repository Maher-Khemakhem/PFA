package tn.fst.eventservice.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import tn.fst.eventservice.dto.EventParticipationEvent;

@Service
@Slf4j
@RequiredArgsConstructor
public class EventParticipationProducer {

    public static final String EVENT_PARTICIPATION_TOPIC = "event-participation";

    private final KafkaTemplate<String, EventParticipationEvent> kafkaTemplate;

    public void publishParticipation(EventParticipationEvent event) {
        kafkaTemplate.send(EVENT_PARTICIPATION_TOPIC, event.getEventId(), event);
        log.info("Event participation published for event: {}", event.getEventId());
    }
}