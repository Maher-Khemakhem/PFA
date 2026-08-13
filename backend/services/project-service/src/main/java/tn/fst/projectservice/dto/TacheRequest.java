package tn.fst.projectservice.dto;

import lombok.Data;
import tn.fst.projectservice.entity.StatusProjet;

import java.time.LocalDate;
import java.util.List;

@Data
public class TacheRequest {
    private String titre;
    private String description;
    private StatusProjet status;
    private LocalDate echeance;
    private int progression;
    private String priorite;
    private String commentaire;
    private List<String> membresEmails;
    private String updatedByEmail;
}