package tn.fst.recommendationservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "AUTH-SERVICE")
public interface AuthServiceClient {

    @GetMapping("/auth/users/{email}")
    UserDto getUserByEmail(@PathVariable String email);
}
