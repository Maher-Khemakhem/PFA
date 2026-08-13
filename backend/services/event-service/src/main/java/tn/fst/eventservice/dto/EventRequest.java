package tn.fst.eventservice.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class EventRequest {

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    @NotBlank(message = "La description est obligatoire")
    private String description;

    @NotBlank(message = "Le type est obligatoire")
    private String type;

    @NotBlank(message = "L'organisateur est obligatoire")
    private String organisateur;

    @NotNull(message = "La date et l'heure sont obligatoires")
    @Future(message = "La date doit être dans le futur")
    private LocalDateTime dateHeure;

    @NotBlank(message = "Le lieu est obligatoire")
    private String lieu;

    @Min(value = 1, message = "Le nombre de places doit être au moins 1")
    private int nombrePlaces;

    private List<String> partenaires;

    private List<String> partnerLogos;

    private String affiche;

    private List<String> galleryPhotos;
}
