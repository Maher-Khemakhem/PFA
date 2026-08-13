package tn.fst.projectservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import tn.fst.projectservice.dto.UserResponse;

@FeignClient(name = "AUTH-SERVICE")
public interface AuthServiceClient {

    @GetMapping("/auth/users/{email}")
    UserResponse getUserByEmail(@PathVariable String email);

    @GetMapping("/auth/users/{email}/exists")
    boolean userExists(@PathVariable String email);
}