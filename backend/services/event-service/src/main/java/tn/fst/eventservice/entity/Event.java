package tn.fst.eventservice.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Event {

    @Id
    private String id;

    private String titre;

    private String description;

    private String type; // Workshop, Compétition, Conférence, Séminaire

    private String organisateur; // email of organization

    private LocalDateTime dateHeure;

    private String lieu;

    private int nombrePlaces;

    @Builder.Default
    private List<String> participants = new ArrayList<>(); // emails

    @Builder.Default
    private List<String> partenaires = new ArrayList<>();

    @Builder.Default
    private List<String> partnerLogos = new ArrayList<>();

    private String affiche; // URL or path to poster image

    @Builder.Default
    private List<String> galleryPhotos = new ArrayList<>();

    @Builder.Default
    private List<EventComment> comments = new ArrayList<>();

    public int getPlacesRestantes() {
        return nombrePlaces - participants.size();
    }
}
