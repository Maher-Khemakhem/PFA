package tn.fst.eventservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "AUTH-SERVICE")
public interface AuthServiceClient {

    @GetMapping("/auth/users/{email}")
    UserDto getUserByEmail(@PathVariable String email);
}

class UserDto {
    private String email;
    private String nom;
    private String role;

    public String getEmail() {
        return email;
    }

    public String getNom() {
        return nom;
    }

    public String getRole() {
        return role;
    }
}
