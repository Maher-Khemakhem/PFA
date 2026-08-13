package tn.fst.projectservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import tn.fst.projectservice.entity.MemberRole;

@Data
public class AddMemberRequest {

    @NotBlank(message = "Email is required")
    private String email;

    private MemberRole role;
}
