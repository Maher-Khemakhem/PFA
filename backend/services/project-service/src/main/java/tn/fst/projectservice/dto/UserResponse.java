package tn.fst.projectservice.dto;

import lombok.Data;

@Data
public class UserResponse {
    private Long id;
    private String email;
    private String name;
    private String role;
}