package tn.fst.notificationservice.dto;

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
public class TacheAssigneeEvent {
    private String tacheId;
    private String tacheTitre;
    private String tacheDescription;
    private String projetId;
    private String projetNom;
    private LocalDate echeance;
    private List<String> membresEmails;
}
