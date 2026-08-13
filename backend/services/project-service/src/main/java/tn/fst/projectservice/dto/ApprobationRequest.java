package tn.fst.projectservice.dto;

import lombok.Data;
import tn.fst.projectservice.entity.StatusApprobation;

@Data
public class ApprobationRequest {
    private StatusApprobation approbation;
    private String commentaireAdmin;
}