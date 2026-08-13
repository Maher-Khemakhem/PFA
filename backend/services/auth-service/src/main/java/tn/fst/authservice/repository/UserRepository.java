package tn.fst.authservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import tn.fst.authservice.entity.User;
import tn.fst.authservice.entity.Role;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);
}
