package tn.fst.eventservice.dto;

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
public class EventResponse {

    private String id;
    private String titre;
    private String description;
    private String type;
    private String organisateur;
    private LocalDateTime dateHeure;
    private String lieu;
    private int nombrePlaces;
    private int placesRestantes;
    private List<String> participants;
    private List<String> partenaires;
    private List<String> partnerLogos;
    private String affiche;
    private List<String> galleryPhotos;
}
