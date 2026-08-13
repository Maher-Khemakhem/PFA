package tn.fst.recommendationservice.controller;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tn.fst.recommendationservice.dto.RecommendationResponse;
import tn.fst.recommendationservice.service.RecommendationService;

import java.util.List;

@RestController
@RequestMapping("/recommendations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RecommendationController {

    private static final Logger log = LoggerFactory.getLogger(RecommendationController.class);

    private final RecommendationService recommendationService;

    @GetMapping("/user/{email}")
    public ResponseEntity<List<RecommendationResponse>> getRecommendations(@PathVariable String email) {
        try {
            return ResponseEntity.ok(recommendationService.getOrGenerate(email));
        } catch (Exception e) {
            log.error("Failed to get recommendations for user {}", email, e);
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping("/user/{email}/refresh")
    public ResponseEntity<List<RecommendationResponse>> refreshRecommendations(@PathVariable String email) {
        try {
            return ResponseEntity.ok(recommendationService.refresh(email));
        } catch (Exception e) {
            log.error("Failed to refresh recommendations for user {}", email, e);
            return ResponseEntity.ok(List.of());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecommendation(@PathVariable String id) {
        recommendationService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
