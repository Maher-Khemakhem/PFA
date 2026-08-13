package tn.fst.projectservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import tn.fst.projectservice.dto.ChatMessageRequest;
import tn.fst.projectservice.service.ChatService;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @MessageMapping("/chat.send")
    public void send(@Valid ChatMessageRequest request) {
        chatService.sendMessage(request);
    }
}
