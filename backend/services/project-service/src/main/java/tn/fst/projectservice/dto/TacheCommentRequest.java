package tn.fst.projectservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TacheCommentRequest {

    @NotBlank(message = "Le nom est obligatoire")
    private String authorName;

    @NotBlank(message = "L'email est obligatoire")
    private String authorEmail;

    @NotBlank(message = "Le commentaire est obligatoire")
    private String message;
}