package tn.fst.recommendationservice.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjetDto {
    private String id;
    private String titre;
    private String desc;
    private String categorie;
    private String chefProjet;
    private String organisation;
    private LocalDate deadline;
    private boolean validite;
    private String status;
    private String approbation;
    private String visibilite;
    private int progression;
    private List<String> membres;
}
