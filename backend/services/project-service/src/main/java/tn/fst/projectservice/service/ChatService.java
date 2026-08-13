package tn.fst.projectservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import tn.fst.projectservice.dto.ChatMessageRequest;
import tn.fst.projectservice.entity.ChatMessage;
import tn.fst.projectservice.entity.Projet;
import tn.fst.projectservice.repository.ChatMessageRepository;
import tn.fst.projectservice.repository.ProjetRepository;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ProjetRepository projetRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatMessage sendMessage(ChatMessageRequest request) {
        Projet projet = projetRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Projet not found: " + request.getProjectId()));

        boolean isChef = request.getSenderEmail() != null
            && request.getSenderEmail().equals(projet.getChefProjet());
        boolean isMember = projet.getMembres() != null
            && projet.getMembres().contains(request.getSenderEmail());

        if (!isChef && !isMember) {
            throw new RuntimeException("Sender is not a member of this project");
        }

        ChatMessage message = ChatMessage.builder()
                .projectId(request.getProjectId())
                .senderEmail(request.getSenderEmail())
                .senderName(request.getSenderName())
                .content(request.getContent())
                .createdAt(Instant.now())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);
        messagingTemplate.convertAndSend("/topic/projects/" + request.getProjectId(), saved);
        return saved;
    }

    public List<ChatMessage> getMessages(String projectId) {
        return chatMessageRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
    }
}
