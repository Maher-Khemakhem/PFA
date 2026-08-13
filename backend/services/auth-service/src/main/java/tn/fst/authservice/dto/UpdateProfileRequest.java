package tn.fst.authservice.dto;

import lombok.Data;

import java.util.List;

@Data
public class UpdateProfileRequest {
    private String name;
    private String faculte;
    private String specialite;
    private String idUniversitaire;
    private List<String> competences;
    private String avatar;

    // Organization-specific fields
    private String organizationType;
    private String responsableNom;
    private String responsableEmail;
    private String responsableTelephone;
    private List<String> sponsors;
    private String logo;
}
