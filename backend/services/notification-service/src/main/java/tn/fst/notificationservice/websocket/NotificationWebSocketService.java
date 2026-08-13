package tn.fst.notificationservice.websocket;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import tn.fst.notificationservice.dto.NotificationResponse;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketService {

    private final ObjectMapper objectMapper;
    private final Map<String, Set<WebSocketSession>> sessionsByUser = new ConcurrentHashMap<>();

    public void register(String userId, WebSocketSession session) {
        sessionsByUser.computeIfAbsent(userId, key -> ConcurrentHashMap.newKeySet()).add(session);
    }

    public void unregister(String userId, WebSocketSession session) {
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        if (sessions == null)
            return;
        sessions.remove(session);
        if (sessions.isEmpty()) {
            sessionsByUser.remove(userId);
        }
    }

    public void sendToUser(String userId, NotificationResponse response) {
        if (userId == null || userId.isBlank())
            return;
        Set<WebSocketSession> sessions = sessionsByUser.get(userId);
        if (sessions == null || sessions.isEmpty())
            return;

        String payload;
        try {
            payload = objectMapper.writeValueAsString(response);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize notification: {}", e.getMessage());
            return;
        }

        for (WebSocketSession session : sessions) {
            if (session == null || !session.isOpen()) {
                unregister(userId, session);
                continue;
            }
            try {
                session.sendMessage(new TextMessage(payload));
            } catch (IOException e) {
                log.warn("Failed to send WebSocket message: {}", e.getMessage());
            }
        }
    }
}
