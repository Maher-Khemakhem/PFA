package tn.fst.projectservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import tn.fst.projectservice.entity.MemberRole;

@Data
public class UpdateMemberRoleRequest {

    @NotNull(message = "Role is required")
    private MemberRole role;
}
