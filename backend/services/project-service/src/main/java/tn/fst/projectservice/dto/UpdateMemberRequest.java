package tn.fst.projectservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateMemberRequest {

    @NotBlank(message = "New email is required")
    private String newEmail;
}
