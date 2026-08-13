package tn.fst.projectservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.fst.projectservice.client.AuthServiceClient;
import tn.fst.projectservice.dto.ApprobationRequest;
import tn.fst.projectservice.dto.ProjetRequest;
import tn.fst.projectservice.dto.TacheCommentRequest;
import tn.fst.projectservice.dto.TacheRequest;
import tn.fst.projectservice.dto.TacheAssigneeEvent;
import tn.fst.projectservice.dto.TacheUpdateEvent;
import tn.fst.projectservice.entity.*;
import tn.fst.projectservice.kafka.TacheEventProducer;
import tn.fst.projectservice.repository.ProjetRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjetService {

    private final ProjetRepository projetRepository;
    private final AuthServiceClient authServiceClient;
    private final TacheEventProducer tacheEventProducer;

    // ✅ Create project
    public Projet create(ProjetRequest request) {
        if (!authServiceClient.userExists(request.getChefProjet())) {
            throw new RuntimeException("Chef " + request.getChefProjet() + " not found");
        }

        if (request.getMembres() != null) {
            for (String email : request.getMembres()) {
                if (!authServiceClient.userExists(email)) {
                    throw new RuntimeException("Member " + email + " not found");
                }
            }
        }

        Projet projet = Projet.builder()
                .titre(request.getTitre())
                .desc(request.getDesc())
                .chefProjet(request.getChefProjet())
                .organisation(request.getOrganisation())
                .deadline(request.getDeadline())
                .validite(request.isValidite())
                .status(StatusProjet.EN_ATTENTE)
                .approbation(StatusApprobation.EN_ATTENTE)
                .visibilite(request.getVisibilite() != null ? request.getVisibilite() : VisibiliteProjet.PUBLIC)
                .progression(0)
                .membres(request.getMembres() != null ? request.getMembres() : new ArrayList<>())
                .taches(request.getTaches() != null ? request.getTaches() : new ArrayList<>())
                .objectifs(request.getObjectifs() != null ? request.getObjectifs() : new ArrayList<>())
                .ressources(request.getRessources() != null ? request.getRessources() : new ArrayList<>())
                .affectations(request.getAffectations() != null ? request.getAffectations() : new HashMap<>())
                .build();
        initializeMemberRoles(projet);
        return projetRepository.save(projet);
    }

    public List<Projet> getAll() {
        return projetRepository.findAll();
    }

    public Projet getById(String id) {
        return projetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Projet not found: " + id));
    }

    public List<Projet> getByChef(String email) {
        return projetRepository.findByChefProjet(email);
    }

    public List<Projet> getByMembre(String email) {
        return projetRepository.findByMembresContaining(email);
    }

    public List<Projet> getByOrganisation(String organisation) {
        return projetRepository.findByOrganisation(organisation);
    }

    public List<Projet> getByStatus(StatusProjet status) {
        return projetRepository.findByStatus(status);
    }

    public List<Projet> getByApprobation(StatusApprobation approbation) {
        return projetRepository.findByApprobation(approbation);
    }

    public List<Projet> getByVisibilite(VisibiliteProjet visibilite) {
        return projetRepository.findByVisibilite(visibilite);
    }

    public List<Projet> getPublicProjects() {
        return projetRepository.findAll().stream()
                .filter(projet -> projet.getVisibilite() == null || projet.getVisibilite() == VisibiliteProjet.PUBLIC)
                .toList();
    }

    // ✅ Admin approval
    public Projet updateApprobation(String id, ApprobationRequest request) {
        Projet projet = getById(id);
        projet.setApprobation(request.getApprobation());
        projet.setCommentaireAdmin(request.getCommentaireAdmin());

        if (request.getApprobation() == StatusApprobation.APPROUVE) {
            projet.setStatus(StatusProjet.EN_COURS);
        }
        if (request.getApprobation() == StatusApprobation.REJETE) {
            projet.setStatus(StatusProjet.ANNULE);
        }

        return projetRepository.save(projet);
    }

    // ✅ Update progression manually
    public Projet updateProgression(String id, int progression) {
        Projet projet = getById(id);
        projet.setProgression(progression);
        if (progression == 100) {
            projet.setStatus(StatusProjet.TERMINE);
        }
        return projetRepository.save(projet);
    }

    // ✅ Full update
    public Projet update(String id, ProjetRequest request) {
        Projet projet = getById(id);
        if (request.getTitre() != null) {
            projet.setTitre(request.getTitre());
        }
        if (request.getDesc() != null) {
            projet.setDesc(request.getDesc());
        }
        if (request.getDeadline() != null) {
            projet.setDeadline(request.getDeadline());
        }
        if (request.getStatus() != null) {
            projet.setStatus(request.getStatus());
        }
        if (request.getVisibilite() != null) {
            projet.setVisibilite(request.getVisibilite());
        }
        if (request.getMembres() != null) {
            List<String> updatedMembers = new ArrayList<>(request.getMembres());
            projet.setMembres(updatedMembers);
            syncMemberRoles(projet, updatedMembers);
        }
        if (request.getTaches() != null) {
            projet.setTaches(request.getTaches());
        }
        if (request.getObjectifs() != null) {
            projet.setObjectifs(request.getObjectifs());
        }
        if (request.getRessources() != null) {
            projet.setRessources(request.getRessources());
        }
        if (request.getAffectations() != null) {
            projet.setAffectations(request.getAffectations());
        }
        return projetRepository.save(projet);
    }

    public void delete(String id) {
        projetRepository.deleteById(id);
    }

    public Projet addMember(String projetId, String email, MemberRole role) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }

        if (!authServiceClient.userExists(email)) {
            throw new RuntimeException("User " + email + " not found");
        }

        Projet projet = getById(projetId);

        if (projet.getMembres() == null) {
            projet.setMembres(new ArrayList<>());
        }

        if (!projet.getMembres().contains(email)) {
            projet.getMembres().add(email);
        }

        ensureMemberRolesMap(projet);
        MemberRole resolvedRole = role != null ? role : resolveDefaultRole(projet, email);
        projet.getMemberRoles().put(email, resolvedRole);

        if (resolvedRole == MemberRole.CHEF_DE_PROJET) {
            String previousChef = projet.getChefProjet();
            if (previousChef != null && !previousChef.isBlank() && !previousChef.equals(email)) {
                projet.getMemberRoles().put(previousChef, MemberRole.MEMBRE_ACTIF);
            }
            projet.setChefProjet(email);
        }

        if (projet.getAffectations() == null) {
            projet.setAffectations(new HashMap<>());
        }

        return projetRepository.save(projet);
    }

    public List<String> getMembers(String projetId) {
        Projet projet = getById(projetId);
        if (projet.getMembres() == null) {
            return new ArrayList<>();
        }
        return projet.getMembres();
    }

    public Projet removeMember(String projetId, String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }

        Projet projet = getById(projetId);

        if (projet.getMembres() != null) {
            projet.getMembres().removeIf(member -> member.equals(email));
        }

        if (projet.getMemberRoles() != null) {
            projet.getMemberRoles().remove(email);
        }

        if (email.equals(projet.getChefProjet())) {
            projet.setChefProjet(null);
        }

        if (projet.getAffectations() != null) {
            projet.getAffectations().remove(email);
        }

        if (projet.getTaches() != null) {
            for (Tache tache : projet.getTaches()) {
                if (tache.getMembresEmails() != null) {
                    tache.getMembresEmails().removeIf(member -> member.equals(email));
                }
            }
        }

        return projetRepository.save(projet);
    }

    public Projet updateMemberEmail(String projetId, String currentEmail, String newEmail) {
        if (currentEmail == null || currentEmail.isBlank()) {
            throw new RuntimeException("Current email is required");
        }
        if (newEmail == null || newEmail.isBlank()) {
            throw new RuntimeException("New email is required");
        }
        if (!authServiceClient.userExists(newEmail)) {
            throw new RuntimeException("User " + newEmail + " not found");
        }

        Projet projet = getById(projetId);

        if (projet.getMembres() == null) {
            projet.setMembres(new ArrayList<>());
        }

        ensureMemberRolesMap(projet);

        if (!projet.getMembres().contains(currentEmail)) {
            throw new RuntimeException("Member " + currentEmail + " is not in this project");
        }

        projet.getMembres().removeIf(member -> member.equals(currentEmail));
        if (!projet.getMembres().contains(newEmail)) {
            projet.getMembres().add(newEmail);
        }

        if (projet.getAffectations() != null && projet.getAffectations().containsKey(currentEmail)) {
            List<String> tacheIds = projet.getAffectations().remove(currentEmail);
            projet.getAffectations().put(newEmail, tacheIds);
        }

        if (projet.getMemberRoles().containsKey(currentEmail)) {
            MemberRole role = projet.getMemberRoles().remove(currentEmail);
            projet.getMemberRoles().put(newEmail, role);
        }

        if (currentEmail.equals(projet.getChefProjet())) {
            projet.setChefProjet(newEmail);
        }

        if (projet.getTaches() != null) {
            for (Tache tache : projet.getTaches()) {
                if (tache.getMembresEmails() != null && tache.getMembresEmails().contains(currentEmail)) {
                    tache.getMembresEmails().removeIf(member -> member.equals(currentEmail));
                    tache.getMembresEmails().add(newEmail);
                }
            }
        }

        return projetRepository.save(projet);
    }

    public Projet updateMemberRole(String projetId, String email, MemberRole role) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }
        if (role == null) {
            throw new RuntimeException("Role is required");
        }

        Projet projet = getById(projetId);
        if (projet.getMembres() == null || !projet.getMembres().contains(email)) {
            throw new RuntimeException("Member " + email + " is not in this project");
        }

        ensureMemberRolesMap(projet);
        projet.getMemberRoles().put(email, role);

        if (role == MemberRole.CHEF_DE_PROJET) {
            String previousChef = projet.getChefProjet();
            if (previousChef != null && !previousChef.isBlank() && !previousChef.equals(email)) {
                projet.getMemberRoles().put(previousChef, MemberRole.MEMBRE_ACTIF);
            }
            projet.setChefProjet(email);
        } else if (email.equals(projet.getChefProjet())) {
            projet.setChefProjet(null);
        }

        return projetRepository.save(projet);
    }

    private void ensureMemberRolesMap(Projet projet) {
        if (projet.getMemberRoles() == null) {
            projet.setMemberRoles(new HashMap<>());
        }
    }

    private MemberRole resolveDefaultRole(Projet projet, String email) {
        if (email != null && email.equals(projet.getChefProjet())) {
            return MemberRole.CHEF_DE_PROJET;
        }
        return MemberRole.MEMBRE_ACTIF;
    }

    private void initializeMemberRoles(Projet projet) {
        ensureMemberRolesMap(projet);
        if (projet.getMembres() == null) {
            projet.setMembres(new ArrayList<>());
        }

        for (String email : projet.getMembres()) {
            projet.getMemberRoles().putIfAbsent(email, resolveDefaultRole(projet, email));
        }

        String chefEmail = projet.getChefProjet();
        if (chefEmail != null && !chefEmail.isBlank()) {
            if (!projet.getMembres().contains(chefEmail)) {
                projet.getMembres().add(chefEmail);
            }
            projet.getMemberRoles().put(chefEmail, MemberRole.CHEF_DE_PROJET);
        }
    }

    private void syncMemberRoles(Projet projet, List<String> membres) {
        ensureMemberRolesMap(projet);

        projet.getMemberRoles().keySet().removeIf(email -> !membres.contains(email));

        for (String email : membres) {
            projet.getMemberRoles().putIfAbsent(email, resolveDefaultRole(projet, email));
        }

        String chefEmail = projet.getChefProjet();
        if (chefEmail != null && !chefEmail.isBlank()) {
            if (!membres.contains(chefEmail)) {
                membres.add(chefEmail);
            }
            projet.getMemberRoles().put(chefEmail, MemberRole.CHEF_DE_PROJET);
        }
    }

    // ✅ Add task to project
    public Projet addTache(String projetId, TacheRequest request) {
        Projet projet = getById(projetId); // ✅ declare projet FIRST
        ensureProjectCollections(projet);

        List<String> membresEmails = request.getMembresEmails() != null
                ? new ArrayList<>(request.getMembresEmails())
                : new ArrayList<>();

        List<String> validatedMembers = new ArrayList<>();
        for (String email : membresEmails) {
            validateMemberForProject(projet, email);
            if (!validatedMembers.contains(email)) {
                validatedMembers.add(email);
            }
        }

        Tache tache = Tache.builder()
                .id(UUID.randomUUID().toString())
                .titre(request.getTitre())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : StatusProjet.EN_ATTENTE)
                .echeance(request.getEcheance())
                .progression(request.getProgression())
                .priorite(request.getPriorite())
                .commentaire(request.getCommentaire() != null ? request.getCommentaire() : "")
                .membresEmails(validatedMembers)
                .comments(new ArrayList<>())
                .build();

        projet.getTaches().add(tache);

        for (String email : validatedMembers) {
            projet.getAffectations()
                    .computeIfAbsent(email, k -> new ArrayList<>())
                    .add(tache.getId());
        }

        Projet saved = projetRepository.save(projet);
        publishAssigneeEventIfNeeded(saved, tache, validatedMembers);
        return saved;
    }

    // ✅ Update task
    public Projet updateTache(String projetId, String tacheId, TacheRequest request) {
        Projet projet = getById(projetId);

        if (projet.getMembres() == null) {
            projet.setMembres(new ArrayList<>());
        }
        Tache tache = projet.getTaches().stream()
                .filter(t -> t.getId().equals(tacheId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Tache not found: " + tacheId));

        tache.setTitre(request.getTitre());
        tache.setDescription(request.getDescription());
        tache.setStatus(request.getStatus());
        tache.setEcheance(request.getEcheance());
        tache.setProgression(request.getProgression());
        if (request.getPriorite() != null) {
            tache.setPriorite(request.getPriorite());
        }
        if (request.getCommentaire() != null) {
            tache.setCommentaire(request.getCommentaire());
        }

        // recalculate project progression from tasks average
        int avgProgression = (int) projet.getTaches().stream()
                .mapToInt(Tache::getProgression)
                .average()
                .orElse(0);
        projet.setProgression(avgProgression);

        if (avgProgression >= 100) {
            projet.setStatus(StatusProjet.TERMINE);
        } else if (avgProgression > 0) {
            projet.setStatus(StatusProjet.EN_COURS);
        } else {
            projet.setStatus(StatusProjet.EN_ATTENTE);
        }

        Projet saved = projetRepository.save(projet);

        String updatedBy = request.getUpdatedByEmail();
        String orgEmail = projet.getOrganisation();
        if (updatedBy != null && !updatedBy.isBlank()
                && orgEmail != null && !orgEmail.isBlank()
                && !updatedBy.equals(orgEmail)) {
            TacheUpdateEvent event = TacheUpdateEvent.builder()
                    .tacheId(tache.getId())
                    .tacheTitre(tache.getTitre())
                    .projetId(projet.getId())
                    .projetNom(projet.getTitre())
                    .updatedByEmail(updatedBy)
                    .orgEmail(orgEmail)
                    .progression(tache.getProgression())
                    .status(tache.getStatus() != null ? tache.getStatus().name() : null)
                    .commentaire(tache.getCommentaire())
                    .build();
            tacheEventProducer.publishTacheUpdated(event);
        }

        return saved;
    }

    // ✅ Delete task
    public Projet deleteTache(String projetId, String tacheId) {
        Projet projet = getById(projetId);
        projet.getTaches().removeIf(t -> t.getId().equals(tacheId));
        projet.getAffectations().values()
                .forEach(tacheIds -> tacheIds.remove(tacheId));
        return projetRepository.save(projet);
    }

    // ✅ Get tasks by member
    public List<Tache> getTachesByMembre(String projetId, String membreEmail) {
        Projet projet = getById(projetId);
        return projet.getTaches().stream()
                .filter(t -> t.getMembresEmails() != null && t.getMembresEmails().contains(membreEmail))
                .toList();
    }

    public List<String> getTaskMembers(String projetId, String tacheId) {
        Tache tache = getTaskOrThrow(projetId, tacheId);
        if (tache.getMembresEmails() == null) {
            return new ArrayList<>();
        }
        return tache.getMembresEmails();
    }

    public Projet addTaskMembers(String projetId, String tacheId, List<String> emails) {
        Projet projet = getById(projetId);
        ensureProjectCollections(projet);

        Tache tache = getTaskOrThrow(projet, tacheId);
        if (tache.getMembresEmails() == null) {
            tache.setMembresEmails(new ArrayList<>());
        }

        List<String> added = new ArrayList<>();
        for (String email : emails) {
            validateMemberForProject(projet, email);
            if (!tache.getMembresEmails().contains(email)) {
                tache.getMembresEmails().add(email);
                added.add(email);
            }
        }

        for (String email : added) {
            projet.getAffectations()
                    .computeIfAbsent(email, k -> new ArrayList<>())
                    .add(tacheId);
        }

        Projet saved = projetRepository.save(projet);
        publishAssigneeEventIfNeeded(saved, tache, added);
        return saved;
    }

    public Projet replaceTaskMembers(String projetId, String tacheId, List<String> emails) {
        Projet projet = getById(projetId);
        ensureProjectCollections(projet);

        Tache tache = getTaskOrThrow(projet, tacheId);
        List<String> oldMembers = tache.getMembresEmails() != null
                ? new ArrayList<>(tache.getMembresEmails())
                : new ArrayList<>();

        List<String> newMembers = emails != null ? emails : new ArrayList<>();
        for (String email : newMembers) {
            validateMemberForProject(projet, email);
        }

        tache.setMembresEmails(new ArrayList<>(newMembers));

        for (String oldEmail : oldMembers) {
            if (!newMembers.contains(oldEmail)) {
                List<String> tacheIds = projet.getAffectations().get(oldEmail);
                if (tacheIds != null) {
                    tacheIds.remove(tacheId);
                }
            }
        }

        for (String email : newMembers) {
            projet.getAffectations()
                    .computeIfAbsent(email, k -> new ArrayList<>())
                    .add(tacheId);
        }

        List<String> added = new ArrayList<>();
        for (String email : newMembers) {
            if (!oldMembers.contains(email)) {
                added.add(email);
            }
        }

        Projet saved = projetRepository.save(projet);
        publishAssigneeEventIfNeeded(saved, tache, added);
        return saved;
    }

    public Projet removeTaskMember(String projetId, String tacheId, String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }

        Projet projet = getById(projetId);
        ensureProjectCollections(projet);

        Tache tache = getTaskOrThrow(projet, tacheId);
        if (tache.getMembresEmails() != null) {
            tache.getMembresEmails().removeIf(member -> member.equals(email));
        }

        List<String> tacheIds = projet.getAffectations().get(email);
        if (tacheIds != null) {
            tacheIds.remove(tacheId);
        }

        return projetRepository.save(projet);
    }

    public List<TacheComment> getTaskComments(String projetId, String tacheId) {
        Tache tache = getTaskOrThrow(projetId, tacheId);
        if (tache.getComments() == null) {
            return new ArrayList<>();
        }
        return tache.getComments();
    }

    public TacheComment addTaskComment(String projetId, String tacheId, TacheCommentRequest request) {
        Projet projet = getById(projetId);
        Tache tache = getTaskOrThrow(projet, tacheId);
        if (tache.getComments() == null) {
            tache.setComments(new ArrayList<>());
        }

        TacheComment comment = TacheComment.builder()
                .id(UUID.randomUUID().toString())
                .authorName(request.getAuthorName())
                .authorEmail(request.getAuthorEmail())
                .message(request.getMessage())
                .createdAt(LocalDateTime.now())
                .build();

        tache.getComments().add(comment);
        projetRepository.save(projet);
        return comment;
    }

    private void ensureProjectCollections(Projet projet) {
        if (projet.getMembres() == null) {
            projet.setMembres(new ArrayList<>());
        }
        if (projet.getTaches() == null) {
            projet.setTaches(new ArrayList<>());
        }
        if (projet.getAffectations() == null) {
            projet.setAffectations(new HashMap<>());
        }
    }

    private Tache getTaskOrThrow(String projetId, String tacheId) {
        Projet projet = getById(projetId);
        return getTaskOrThrow(projet, tacheId);
    }

    private Tache getTaskOrThrow(Projet projet, String tacheId) {
        return projet.getTaches().stream()
                .filter(t -> t.getId().equals(tacheId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Tache not found: " + tacheId));
    }

    private void validateMemberForProject(Projet projet, String email) {
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email is required");
        }
        if (!authServiceClient.userExists(email)) {
            throw new RuntimeException("User " + email + " not found");
        }
        if (!projet.getMembres().contains(email)) {
            throw new RuntimeException("Member " + email + " is not in this project");
        }
    }

    private void publishAssigneeEventIfNeeded(Projet projet, Tache tache, List<String> addedMembers) {
        if (addedMembers == null || addedMembers.isEmpty()) {
            return;
        }

        TacheAssigneeEvent event = TacheAssigneeEvent.builder()
                .tacheId(tache.getId())
                .tacheTitre(tache.getTitre())
                .tacheDescription(tache.getDescription())
                .projetId(projet.getId())
                .projetNom(projet.getTitre())
                .echeance(tache.getEcheance())
                .membresEmails(addedMembers)
                .build();
        tacheEventProducer.publishTacheAssignee(event);
    }
}
