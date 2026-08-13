package tn.fst.projectservice.kafka;

import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Qualifier;
import tn.fst.projectservice.dto.TacheAssigneeEvent;
import tn.fst.projectservice.dto.TacheUpdateEvent;

@Service
@Slf4j
public class TacheEventProducer {

    private final KafkaTemplate<String, TacheAssigneeEvent> kafkaTemplate;
    private final KafkaTemplate<String, TacheUpdateEvent> tacheUpdateKafkaTemplate;
    public static final String TACHE_ASSIGNEE_TOPIC = "tache-assignee";
    public static final String TACHE_UPDATED_TOPIC = "tache-updated";

    public TacheEventProducer(
            KafkaTemplate<String, TacheAssigneeEvent> kafkaTemplate,
            @Qualifier("tacheUpdateKafkaTemplate") KafkaTemplate<String, TacheUpdateEvent> tacheUpdateKafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.tacheUpdateKafkaTemplate = tacheUpdateKafkaTemplate;
    }

    public void publishTacheAssignee(TacheAssigneeEvent event) {
        // Send one message — notification-service will fan out to each member
        kafkaTemplate.send(TACHE_ASSIGNEE_TOPIC, event.getTacheId(), event);
        log.info("Event tache-assignee publié pour tache: {}", event.getTacheId());
    }

    public void publishTacheUpdated(TacheUpdateEvent event) {
        tacheUpdateKafkaTemplate.send(TACHE_UPDATED_TOPIC, event.getTacheId(), event);
        log.info("Event tache-updated publié pour tache: {}", event.getTacheId());
    }
}
