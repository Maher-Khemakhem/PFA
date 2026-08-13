package tn.fst.projectservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.fst.projectservice.dto.AddMemberRequest;
import tn.fst.projectservice.dto.ApprobationRequest;
import tn.fst.projectservice.dto.ProjetRequest;
import tn.fst.projectservice.dto.TacheCommentRequest;
import tn.fst.projectservice.dto.TacheRequest;
import tn.fst.projectservice.dto.TaskMembersRequest;
import tn.fst.projectservice.dto.UpdateMemberRequest;
import tn.fst.projectservice.dto.UpdateMemberRoleRequest;
import tn.fst.projectservice.entity.ChatMessage;
import tn.fst.projectservice.entity.Projet;
import tn.fst.projectservice.entity.StatusApprobation;
import tn.fst.projectservice.entity.StatusProjet;
import tn.fst.projectservice.entity.TacheComment;
import tn.fst.projectservice.entity.Tache;
import tn.fst.projectservice.entity.VisibiliteProjet;
import tn.fst.projectservice.service.ProjetService;
import tn.fst.projectservice.service.ChatService;

import java.util.List;

@RestController
@RequestMapping("/projets")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProjetController {

    private final ProjetService projetService;
    private final ChatService chatService;

    // ===== PROJET ENDPOINTS =====

    @PostMapping
    public ResponseEntity<Projet> create(@RequestBody ProjetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projetService.create(request));
    }

    @GetMapping
    public ResponseEntity<List<Projet>> getAll() {
        return ResponseEntity.ok(projetService.getAll());
    }

    @GetMapping("/public")
    public ResponseEntity<List<Projet>> getPublicProjects() {
        return ResponseEntity.ok(projetService.getPublicProjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Projet> getById(@PathVariable String id) {
        return ResponseEntity.ok(projetService.getById(id));
    }

    @GetMapping("/chef/{email}")
    public ResponseEntity<List<Projet>> getByChef(@PathVariable String email) {
        return ResponseEntity.ok(projetService.getByChef(email));
    }

    @GetMapping("/membre/{email}")
    public ResponseEntity<List<Projet>> getByMembre(@PathVariable String email) {
        return ResponseEntity.ok(projetService.getByMembre(email));
    }

    @GetMapping("/organisation/{organisation}")
    public ResponseEntity<List<Projet>> getByOrganisation(@PathVariable String organisation) {
        return ResponseEntity.ok(projetService.getByOrganisation(organisation));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Projet>> getByStatus(@PathVariable StatusProjet status) {
        return ResponseEntity.ok(projetService.getByStatus(status));
    }

    @GetMapping("/approbation/{approbation}")
    public ResponseEntity<List<Projet>> getByApprobation(@PathVariable StatusApprobation approbation) {
        return ResponseEntity.ok(projetService.getByApprobation(approbation));
    }

    @GetMapping("/visibilite/{visibilite}")
    public ResponseEntity<List<Projet>> getByVisibilite(@PathVariable VisibiliteProjet visibilite) {
        return ResponseEntity.ok(projetService.getByVisibilite(visibilite));
    }

    @PatchMapping("/{id}/approbation")
    public ResponseEntity<Projet> updateApprobation(@PathVariable String id,
            @RequestBody ApprobationRequest request) {
        return ResponseEntity.ok(projetService.updateApprobation(id, request));
    }

    @PatchMapping("/{id}/progression")
    public ResponseEntity<Projet> updateProgression(@PathVariable String id,
            @RequestParam int valeur) {
        return ResponseEntity.ok(projetService.updateProgression(id, valeur));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Projet> update(@PathVariable String id,
            @RequestBody ProjetRequest request) {
        return ResponseEntity.ok(projetService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        projetService.delete(id);
    }

    // ===== MEMBRE ENDPOINTS =====

    @GetMapping("/{id}/membres")
    public ResponseEntity<List<String>> getMembers(@PathVariable String id) {
        return ResponseEntity.ok(projetService.getMembers(id));
    }

    @PostMapping("/{id}/membres")
    public ResponseEntity<Projet> addMember(@PathVariable String id,
            @Valid @RequestBody AddMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projetService.addMember(id, request.getEmail(), request.getRole()));
    }

    @PutMapping("/{id}/membres/{email}")
    public ResponseEntity<Projet> updateMember(@PathVariable String id,
            @PathVariable String email,
            @Valid @RequestBody UpdateMemberRequest request) {
        return ResponseEntity.ok(projetService.updateMemberEmail(id, email, request.getNewEmail()));
    }

    @DeleteMapping("/{id}/membres/{email}")
    public ResponseEntity<Projet> removeMember(@PathVariable String id,
            @PathVariable String email) {
        return ResponseEntity.ok(projetService.removeMember(id, email));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<ChatMessage>> getProjectMessages(@PathVariable String id) {
        return ResponseEntity.ok(chatService.getMessages(id));
    }

    @PatchMapping("/{id}/membres/{email}/role")
    public ResponseEntity<Projet> updateMemberRole(@PathVariable String id,
            @PathVariable String email,
            @Valid @RequestBody UpdateMemberRoleRequest request) {
        return ResponseEntity.ok(projetService.updateMemberRole(id, email, request.getRole()));
    }

    // ===== TACHE ENDPOINTS =====

    @PostMapping("/{projetId}/taches")
    public ResponseEntity<Projet> addTache(@PathVariable String projetId,
            @RequestBody TacheRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projetService.addTache(projetId, request));
    }

    @PutMapping("/{projetId}/taches/{tacheId}")
    public ResponseEntity<Projet> updateTache(@PathVariable String projetId,
            @PathVariable String tacheId,
            @RequestBody TacheRequest request) {
        return ResponseEntity.ok(projetService.updateTache(projetId, tacheId, request));
    }

    @GetMapping("/{projetId}/taches/{tacheId}/membres")
    public ResponseEntity<List<String>> getTaskMembers(@PathVariable String projetId,
            @PathVariable String tacheId) {
        return ResponseEntity.ok(projetService.getTaskMembers(projetId, tacheId));
    }

    @PostMapping("/{projetId}/taches/{tacheId}/membres")
    public ResponseEntity<Projet> addTaskMembers(@PathVariable String projetId,
            @PathVariable String tacheId,
            @Valid @RequestBody TaskMembersRequest request) {
        return ResponseEntity.ok(projetService.addTaskMembers(projetId, tacheId, request.getEmails()));
    }

    @PutMapping("/{projetId}/taches/{tacheId}/membres")
    public ResponseEntity<Projet> replaceTaskMembers(@PathVariable String projetId,
            @PathVariable String tacheId,
            @Valid @RequestBody TaskMembersRequest request) {
        return ResponseEntity.ok(projetService.replaceTaskMembers(projetId, tacheId, request.getEmails()));
    }

    @DeleteMapping("/{projetId}/taches/{tacheId}/membres/{email}")
    public ResponseEntity<Projet> removeTaskMember(@PathVariable String projetId,
            @PathVariable String tacheId,
            @PathVariable String email) {
        return ResponseEntity.ok(projetService.removeTaskMember(projetId, tacheId, email));
    }

    @DeleteMapping("/{projetId}/taches/{tacheId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTache(@PathVariable String projetId,
            @PathVariable String tacheId) {
        projetService.deleteTache(projetId, tacheId);
    }

    @GetMapping("/{projetId}/taches/{tacheId}/commentaires")
    public ResponseEntity<List<TacheComment>> getTaskComments(@PathVariable String projetId,
            @PathVariable String tacheId) {
        return ResponseEntity.ok(projetService.getTaskComments(projetId, tacheId));
    }

    @PostMapping("/{projetId}/taches/{tacheId}/commentaires")
    public ResponseEntity<TacheComment> addTaskComment(@PathVariable String projetId,
            @PathVariable String tacheId,
            @Valid @RequestBody TacheCommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projetService.addTaskComment(projetId, tacheId, request));
    }

    @GetMapping("/{projetId}/taches/membre/{email}")
    public ResponseEntity<List<Tache>> getTachesByMembre(@PathVariable String projetId,
            @PathVariable String email) {
        return ResponseEntity.ok(projetService.getTachesByMembre(projetId, email));
    }
}
