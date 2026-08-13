package tn.fst.notificationservice.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JacksonJsonDeserializer; // ✅ new import
import tn.fst.notificationservice.dto.EventParticipationEvent;
import tn.fst.notificationservice.dto.TacheAssigneeEvent;
import tn.fst.notificationservice.dto.TacheUpdateEvent;

import java.util.HashMap;
import java.util.Map;

@EnableKafka
@Configuration
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.consumer.group-id:notification-service-group}")
    private String groupId;

    @Bean
    public ConsumerFactory<String, TacheAssigneeEvent> consumerFactory() {
        // ✅ JacksonJsonDeserializer replaces the deprecated JsonDeserializer
        // Producer sends raw JSON bytes with no type headers, so we:
        // 1. Target TacheAssigneeEvent directly
        // 2. Trust all packages (no type headers to validate against)
        // 3. Disable type header resolution entirely
        JacksonJsonDeserializer<TacheAssigneeEvent> jsonDeserializer = new JacksonJsonDeserializer<>(
                TacheAssigneeEvent.class);
        jsonDeserializer.trustedPackages("*");
        jsonDeserializer.setUseTypeHeaders(false); // producer sends no __TypeId__ headers

        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(), // key: plain String
                new ErrorHandlingDeserializer<>(jsonDeserializer) // value: safe JSON with error capture
        );
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, TacheAssigneeEvent> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, TacheAssigneeEvent> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, TacheUpdateEvent> tacheUpdateConsumerFactory() {
        JacksonJsonDeserializer<TacheUpdateEvent> jsonDeserializer = new JacksonJsonDeserializer<>(
                TacheUpdateEvent.class);
        jsonDeserializer.trustedPackages("*");
        jsonDeserializer.setUseTypeHeaders(false);

        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                new ErrorHandlingDeserializer<>(jsonDeserializer));
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, TacheUpdateEvent> tacheUpdateKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, TacheUpdateEvent> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(tacheUpdateConsumerFactory());
        return factory;
    }

    @Bean
    public ConsumerFactory<String, EventParticipationEvent> eventParticipationConsumerFactory() {
        JacksonJsonDeserializer<EventParticipationEvent> jsonDeserializer = new JacksonJsonDeserializer<>(
                EventParticipationEvent.class);
        jsonDeserializer.trustedPackages("*");
        jsonDeserializer.setUseTypeHeaders(false);

        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");

        return new DefaultKafkaConsumerFactory<>(
                props,
                new StringDeserializer(),
                new ErrorHandlingDeserializer<>(jsonDeserializer));
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, EventParticipationEvent> eventParticipationKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, EventParticipationEvent> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(eventParticipationConsumerFactory());
        return factory;
    }
}