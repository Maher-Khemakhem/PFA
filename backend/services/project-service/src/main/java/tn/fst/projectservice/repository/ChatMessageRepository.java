package tn.fst.projectservice.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.fst.projectservice.entity.ChatMessage;

import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    List<ChatMessage> findByProjectIdOrderByCreatedAtAsc(String projectId);
}
