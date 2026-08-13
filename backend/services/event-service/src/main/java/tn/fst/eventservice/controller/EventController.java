package tn.fst.eventservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.fst.eventservice.dto.CommentRequest;
import tn.fst.eventservice.dto.CommentResponse;
import tn.fst.eventservice.dto.EventRequest;
import tn.fst.eventservice.dto.EventResponse;
import tn.fst.eventservice.dto.ParticipationRequest;
import tn.fst.eventservice.service.EventService;

import java.util.List;

@RestController
@RequestMapping("/events")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EventController {

    private final EventService eventService;

    @PostMapping
    public ResponseEntity<EventResponse> createEvent(@Valid @RequestBody EventRequest request) {
        EventResponse response = eventService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<EventResponse>> getAllEvents() {
        List<EventResponse> events = eventService.getAll();
        return ResponseEntity.ok(events);
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<EventResponse>> getUpcomingEvents() {
        List<EventResponse> events = eventService.getUpcomingEvents();
        return ResponseEntity.ok(events);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEventById(@PathVariable String id) {
        EventResponse response = eventService.getById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/organisateur/{email}")
    public ResponseEntity<List<EventResponse>> getEventsByOrganisateur(@PathVariable String email) {
        List<EventResponse> events = eventService.getByOrganisateur(email);
        return ResponseEntity.ok(events);
    }

    @GetMapping("/participations/{email}")
    public ResponseEntity<List<EventResponse>> getMyParticipations(@PathVariable String email) {
        List<EventResponse> events = eventService.getMyParticipations(email);
        return ResponseEntity.ok(events);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable String id,
            @Valid @RequestBody EventRequest request) {
        EventResponse response = eventService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(@PathVariable String id) {
        eventService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/participate")
    public ResponseEntity<EventResponse> participate(
            @PathVariable String id,
            @Valid @RequestBody ParticipationRequest request) {
        EventResponse response = eventService.participate(id, request.getEmail());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/participate/{email}")
    public ResponseEntity<EventResponse> cancelParticipation(
            @PathVariable String id,
            @PathVariable String email) {
        EventResponse response = eventService.cancelParticipation(id, email);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable String id) {
        return ResponseEntity.ok(eventService.getComments(id));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable String id,
            @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.addComment(id, request));
    }
}
