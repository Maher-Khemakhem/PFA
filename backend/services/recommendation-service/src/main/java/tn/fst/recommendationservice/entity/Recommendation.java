package tn.fst.recommendationservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "recommendations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Recommendation {

    @Id
    private String id;

    private String userId; // student email

    private String projetId;

    private String eventId;

    // PROJECT or EVENT
    private String recommendationType;

    private String titre;

    private String categorie;

    private int competenceMatch; // 0-100%

    private String explication;

    @Builder.Default
    private LocalDateTime dateRecommendation = LocalDateTime.now();

    private List<String> competencesMatched;
}
