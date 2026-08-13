package tn.fst.authservice.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import tn.fst.authservice.dto.AuthResponse;
import tn.fst.authservice.dto.LoginRequest;
import tn.fst.authservice.dto.RegisterRequest;
import tn.fst.authservice.dto.UpdateProfileRequest;
import tn.fst.authservice.dto.UserResponse;
import tn.fst.authservice.entity.Role;
import tn.fst.authservice.entity.User;
import tn.fst.authservice.repository.UserRepository;
import tn.fst.authservice.security.JwtService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {

        // ✅ Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
                .email(request.getEmail())
                .name(request.getName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                // Student-specific fields
                .faculte(request.getFaculte())
                .specialite(request.getSpecialite())
                .idUniversitaire(request.getIdUniversitaire())
                .competences(request.getCompetences())
                .avatar(request.getAvatar())
                // Organization-specific fields
                .organizationType(request.getOrganizationType())
                .responsableNom(request.getResponsableNom())
                .responsableEmail(request.getResponsableEmail())
                .responsableTelephone(request.getResponsableTelephone())
                .sponsors(request.getSponsors())
                .logo(request.getLogo())
                .build();

        userRepository.save(user);

        return new AuthResponse(jwtService.generateToken(user.getEmail()));
    }

    public AuthResponse login(LoginRequest request) {

        // ✅ Let Spring Security handle authentication (wrong password, user not found)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()));

        // ✅ If we reach here, credentials are valid
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new AuthResponse(jwtService.generateToken(user.getEmail()));
    }

    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        return mapToUserResponse(user);
    }

    public boolean userExists(String email) {
        return userRepository.existsByEmail(email);
    }

    public List<UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role)
                .stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        // Update fields
        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getFaculte() != null) {
            user.setFaculte(request.getFaculte());
        }
        if (request.getSpecialite() != null) {
            user.setSpecialite(request.getSpecialite());
        }
        if (request.getIdUniversitaire() != null) {
            user.setIdUniversitaire(request.getIdUniversitaire());
        }
        if (request.getCompetences() != null) {
            user.setCompetences(request.getCompetences());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }
        if (request.getOrganizationType() != null) {
            user.setOrganizationType(request.getOrganizationType());
        }
        if (request.getResponsableNom() != null) {
            user.setResponsableNom(request.getResponsableNom());
        }
        if (request.getResponsableEmail() != null) {
            user.setResponsableEmail(request.getResponsableEmail());
        }
        if (request.getResponsableTelephone() != null) {
            user.setResponsableTelephone(request.getResponsableTelephone());
        }
        if (request.getSponsors() != null) {
            user.setSponsors(request.getSponsors());
        }
        if (request.getLogo() != null) {
            user.setLogo(request.getLogo());
        }

        User updated = userRepository.save(user);
        return mapToUserResponse(updated);
    }

    public void deleteUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        userRepository.delete(user);
    }

    private UserResponse mapToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setRole(user.getRole().name());
        response.setFaculte(user.getFaculte());
        response.setSpecialite(user.getSpecialite());
        response.setIdUniversitaire(user.getIdUniversitaire());
        response.setCompetences(user.getCompetences());
        response.setAvatar(user.getAvatar());
        response.setOrganizationType(user.getOrganizationType());
        response.setResponsableNom(user.getResponsableNom());
        response.setResponsableEmail(user.getResponsableEmail());
        response.setResponsableTelephone(user.getResponsableTelephone());
        response.setSponsors(user.getSponsors());
        response.setLogo(user.getLogo());
        return response;
    }
}
