package tn.fst.eventservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {

    private String id;

    private String authorName;

    private String authorEmail;

    private String message;

    private LocalDateTime createdAt;
}
