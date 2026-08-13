package tn.fst.authservice.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@Table(name="users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Extended profile fields
    private String faculte;

    private String specialite;

    private String idUniversitaire;

    private String avatar; // URL or path to avatar image

    @ElementCollection
    @CollectionTable(name = "user_competences", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "competence")
    @Builder.Default
    private List<String> competences = new ArrayList<>();

    // Organization-specific fields
    private String organizationType; // Club, Association, Département

    private String responsableNom;

    private String responsableEmail;

    private String responsableTelephone;

    @ElementCollection
    @CollectionTable(name = "user_sponsors", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "sponsor")
    @Builder.Default
    private List<String> sponsors = new ArrayList<>();

    private String logo; // URL or path to organization logo
}