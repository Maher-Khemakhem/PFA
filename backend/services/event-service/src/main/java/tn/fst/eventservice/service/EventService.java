package tn.fst.eventservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.fst.eventservice.kafka.EventParticipationProducer;
import tn.fst.eventservice.dto.CommentRequest;
import tn.fst.eventservice.dto.CommentResponse;
import tn.fst.eventservice.dto.EventRequest;
import tn.fst.eventservice.dto.EventResponse;
import tn.fst.eventservice.dto.EventParticipationEvent;
import tn.fst.eventservice.entity.Event;
import tn.fst.eventservice.entity.EventComment;
import tn.fst.eventservice.repository.EventRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventParticipationProducer eventParticipationProducer;

    public EventResponse create(EventRequest request) {
        Event event = Event.builder()
                .titre(request.getTitre())
                .description(request.getDescription())
                .type(request.getType())
                .organisateur(request.getOrganisateur())
                .dateHeure(request.getDateHeure())
                .lieu(request.getLieu())
                .nombrePlaces(request.getNombrePlaces())
                .participants(new ArrayList<>())
                .partenaires(request.getPartenaires() != null ? request.getPartenaires() : new ArrayList<>())
                .partnerLogos(request.getPartnerLogos() != null ? request.getPartnerLogos() : new ArrayList<>())
                .affiche(request.getAffiche())
                .galleryPhotos(request.getGalleryPhotos() != null ? request.getGalleryPhotos() : new ArrayList<>())
                .build();

        Event saved = eventRepository.save(event);
        return toResponse(saved);
    }

    public List<EventResponse> getAll() {
        return eventRepository.findAllByOrderByDateHeureDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public EventResponse getById(String id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé avec l'id: " + id));
        return toResponse(event);
    }

    public List<EventResponse> getByOrganisateur(String email) {
        return eventRepository.findByOrganisateur(email)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<EventResponse> getUpcomingEvents() {
        return eventRepository.findByDateHeureAfter(LocalDateTime.now())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public EventResponse update(String id, EventRequest request) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé avec l'id: " + id));

        event.setTitre(request.getTitre());
        event.setDescription(request.getDescription());
        event.setType(request.getType());
        event.setDateHeure(request.getDateHeure());
        event.setLieu(request.getLieu());
        event.setNombrePlaces(request.getNombrePlaces());
        if (request.getPartenaires() != null) {
            event.setPartenaires(request.getPartenaires());
        }
        if (request.getPartnerLogos() != null) {
            event.setPartnerLogos(request.getPartnerLogos());
        }
        if (request.getAffiche() != null) {
            event.setAffiche(request.getAffiche());
        }
        if (request.getGalleryPhotos() != null) {
            event.setGalleryPhotos(request.getGalleryPhotos());
        }

        Event updated = eventRepository.save(event);
        return toResponse(updated);
    }

    public void delete(String id) {
        if (!eventRepository.existsById(id)) {
            throw new RuntimeException("Événement non trouvé avec l'id: " + id);
        }
        eventRepository.deleteById(id);
    }

    public EventResponse participate(String id, String userEmail) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé avec l'id: " + id));

        if (event.getParticipants().contains(userEmail)) {
            throw new RuntimeException("Vous êtes déjà inscrit à cet événement");
        }

        if (event.getPlacesRestantes() <= 0) {
            throw new RuntimeException("Aucune place disponible pour cet événement");
        }

        event.getParticipants().add(userEmail);
        Event updated = eventRepository.save(event);

        if (updated.getOrganisateur() != null && !updated.getOrganisateur().isBlank()) {
            eventParticipationProducer.publishParticipation(EventParticipationEvent.builder()
                    .eventId(updated.getId())
                    .eventTitle(updated.getTitre())
                    .participantEmail(userEmail)
                    .organizerEmail(updated.getOrganisateur())
                    .build());
        }

        return toResponse(updated);
    }

    public EventResponse cancelParticipation(String id, String userEmail) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé avec l'id: " + id));

        if (!event.getParticipants().contains(userEmail)) {
            throw new RuntimeException("Vous n'êtes pas inscrit à cet événement");
        }

        event.getParticipants().remove(userEmail);
        Event updated = eventRepository.save(event);
        return toResponse(updated);
    }

    public List<EventResponse> getMyParticipations(String email) {
        return eventRepository.findByParticipantsContaining(email)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public List<CommentResponse> getComments(String eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé avec l'id: " + eventId));
        return event.getComments()
                .stream()
                .map(this::toCommentResponse)
                .collect(Collectors.toList());
    }

    public CommentResponse addComment(String eventId, CommentRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Événement non trouvé avec l'id: " + eventId));

        List<EventComment> comments = event.getComments() != null
                ? event.getComments()
                : new ArrayList<>();

        EventComment comment = EventComment.builder()
                .id(UUID.randomUUID().toString())
                .authorName(request.getAuthorName())
                .authorEmail(request.getAuthorEmail())
                .message(request.getMessage())
                .createdAt(LocalDateTime.now())
                .build();

        comments.add(comment);
        event.setComments(comments);
        eventRepository.save(event);

        return toCommentResponse(comment);
    }

    private EventResponse toResponse(Event event) {
        return EventResponse.builder()
                .id(event.getId())
                .titre(event.getTitre())
                .description(event.getDescription())
                .type(event.getType())
                .organisateur(event.getOrganisateur())
                .dateHeure(event.getDateHeure())
                .lieu(event.getLieu())
                .nombrePlaces(event.getNombrePlaces())
                .placesRestantes(event.getPlacesRestantes())
                .participants(event.getParticipants())
                .partenaires(event.getPartenaires())
                .partnerLogos(event.getPartnerLogos())
                .affiche(event.getAffiche())
                .galleryPhotos(event.getGalleryPhotos())
                .build();
    }

    private CommentResponse toCommentResponse(EventComment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .authorName(comment.getAuthorName())
                .authorEmail(comment.getAuthorEmail())
                .message(comment.getMessage())
                .createdAt(comment.getCreatedAt())
                .build();
    }
}
