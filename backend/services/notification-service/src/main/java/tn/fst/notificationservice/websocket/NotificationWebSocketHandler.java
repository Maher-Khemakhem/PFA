package tn.fst.notificationservice.websocket;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationWebSocketHandler extends TextWebSocketHandler {

    private final NotificationWebSocketService webSocketService;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String userId = getQueryParam(session.getUri(), "email");
        if (userId == null || userId.isBlank()) {
            userId = getQueryParam(session.getUri(), "userId");
        }

        if (userId == null || userId.isBlank()) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        session.getAttributes().put("userId", userId);
        webSocketService.register(userId, session);
        session.sendMessage(new TextMessage("{\"type\":\"connected\"}"));
        log.info("WebSocket connected for user {}", userId);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Object userId = session.getAttributes().get("userId");
        if (userId instanceof String id) {
            webSocketService.unregister(id, session);
            log.info("WebSocket disconnected for user {}", id);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        Object userId = session.getAttributes().get("userId");
        if (userId instanceof String id) {
            webSocketService.unregister(id, session);
        }
        log.warn("WebSocket transport error: {}", exception.getMessage());
    }

    private String getQueryParam(URI uri, String key) {
        if (uri == null || uri.getQuery() == null)
            return null;
        Map<String, String> params = new HashMap<>();
        String[] pairs = uri.getQuery().split("&");
        for (String pair : pairs) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2) {
                String decodedKey = URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
                String decodedValue = URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
                params.put(decodedKey, decodedValue);
            }
        }
        return params.get(key);
    }
}
