package tn.fst.recommendationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {

    private String id;
    private String userId;
    private String projetId;
    private String eventId;
    private String recommendationType;
    private String titre;
    private String categorie;
    private int competenceMatch;
    private String explication;
    private LocalDateTime dateRecommendation;
    private List<String> competencesMatched;
}
