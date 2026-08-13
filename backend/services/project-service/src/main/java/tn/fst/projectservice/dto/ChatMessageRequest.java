package tn.fst.projectservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChatMessageRequest {

    @NotBlank(message = "Project ID is required")
    private String projectId;

    @NotBlank(message = "Sender email is required")
    private String senderEmail;

    @NotBlank(message = "Sender name is required")
    private String senderName;

    @NotBlank(message = "Content is required")
    private String content;
}
