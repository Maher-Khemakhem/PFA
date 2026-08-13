package tn.fst.recommendationservice.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private String email;
    private String name;
    private String role;
    private String faculte;
    private String specialite;
    private String idUniversitaire;
    private List<String> competences;
}
