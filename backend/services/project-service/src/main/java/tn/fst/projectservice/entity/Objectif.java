package tn.fst.projectservice.entity;

import lombok.*;

import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Objectif {
    private String titre;
    private String description;
    private LocalDate echeance;
    private boolean atteint;
}