package tn.fst.projectservice.dto;

import lombok.Data;
import tn.fst.projectservice.entity.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class ProjetRequest {
    private String titre;
    private String desc;
    private String chefProjet;
    private String organisation;
    private LocalDate deadline;
    private boolean validite;
    private StatusProjet status;
    private VisibiliteProjet visibilite;
    private List<String> membres;
    private List<Tache> taches;
    private List<Objectif> objectifs;
    private List<Ressource> ressources;
    private Map<String, List<String>> affectations;
}
