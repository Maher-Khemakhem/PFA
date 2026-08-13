package tn.fst.projectservice.entity;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ressource {
    private String nom;
    private String type;    // HUMAIN, MATERIEL, FINANCIER
    private String valeur;
}