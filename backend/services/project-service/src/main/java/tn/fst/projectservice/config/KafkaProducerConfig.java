package tn.fst.projectservice.config;

import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JacksonJsonSerializer; // ✅ 4.0 class
import tn.fst.projectservice.dto.TacheAssigneeEvent;
import tn.fst.projectservice.dto.TacheUpdateEvent;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaProducerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Bean
    public ProducerFactory<String, TacheAssigneeEvent> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);

        // ✅ Fluent API: no-arg constructor + .noTypeInfo()
        // noTypeInfo() = don't add __TypeId__ headers, matching the consumer's
        // setUseTypeHeaders(false)
        JacksonJsonSerializer<TacheAssigneeEvent> valueSerializer = new JacksonJsonSerializer<TacheAssigneeEvent>()
                .noTypeInfo();

        return new DefaultKafkaProducerFactory<>(
                config,
                new StringSerializer(),
                valueSerializer);
    }

    @Bean
    public KafkaTemplate<String, TacheAssigneeEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    @Bean
    public ProducerFactory<String, TacheUpdateEvent> tacheUpdateProducerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);

        JacksonJsonSerializer<TacheUpdateEvent> valueSerializer = new JacksonJsonSerializer<TacheUpdateEvent>()
                .noTypeInfo();

        return new DefaultKafkaProducerFactory<>(
                config,
                new StringSerializer(),
                valueSerializer);
    }

    @Bean
    public KafkaTemplate<String, TacheUpdateEvent> tacheUpdateKafkaTemplate() {
        return new KafkaTemplate<>(tacheUpdateProducerFactory());
    }
}