package tn.fst.projectservice.entity;

import lombok.*;
import org.springframework.data.annotation.Id;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tache {
    @Id
    private String id;
    private String titre;
    private String description;
    private StatusProjet status;
    private LocalDate echeance;
    private int progression; // 0-100%
    private String priorite;
    private String commentaire;
    private List<String> membresEmails; // multiple assigned members
    @Builder.Default
    private List<TacheComment> comments = new ArrayList<>();
}