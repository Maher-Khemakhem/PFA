package tn.fst.projectservice.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class TaskMembersRequest {

    @NotEmpty(message = "Emails are required")
    private List<String> emails;
}
