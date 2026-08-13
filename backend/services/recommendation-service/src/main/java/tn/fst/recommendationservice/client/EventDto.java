package tn.fst.recommendationservice.client;

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
public class EventDto {
    private String id;
    private String titre;
    private String description;
    private String type;
    private String organisateur;
    private LocalDateTime dateHeure;
    private String lieu;
    private List<String> participants;
}
