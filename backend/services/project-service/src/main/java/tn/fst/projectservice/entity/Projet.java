package tn.fst.projectservice.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Document(collection = "projets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Projet {

    @Id
    private String id;
    private String titre;
    private String desc;
    private String chefProjet;
    private String organisation;
    private LocalDate deadline;
    private boolean validite;
    private StatusProjet status;
    private StatusApprobation approbation;
    private VisibiliteProjet visibilite;
    private String commentaireAdmin;
    private int progression; // 0-100%
    private List<String> membres;
    private Map<String, MemberRole> memberRoles; // email -> role in project
    private List<Tache> taches;
    private List<Objectif> objectifs;
    private List<Ressource> ressources;
    private Map<String, List<String>> affectations; // email -> list of tache IDs
}
