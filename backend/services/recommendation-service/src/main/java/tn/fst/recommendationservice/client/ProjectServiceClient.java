package tn.fst.recommendationservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;

@FeignClient(name = "PROJECT-SERVICE")
public interface ProjectServiceClient {

    @GetMapping("/projets")
    List<ProjetDto> getAllProjets();

    @GetMapping("/projets/public")
    List<ProjetDto> getPublicProjets();
}
