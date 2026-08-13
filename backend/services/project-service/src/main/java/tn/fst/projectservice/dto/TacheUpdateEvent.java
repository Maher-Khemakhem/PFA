package tn.fst.projectservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TacheUpdateEvent {
    private String tacheId;
    private String tacheTitre;
    private String projetId;
    private String projetNom;
    private String updatedByEmail;
    private String orgEmail;
    private Integer progression;
    private String status;
    private String commentaire;
}
