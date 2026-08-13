package tn.fst.recommendationservice.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.fst.recommendationservice.entity.Recommendation;

import java.util.List;

@Repository
public interface RecommendationRepository extends MongoRepository<Recommendation, String> {

    List<Recommendation> findByUserIdOrderByCompetenceMatchDesc(String userId);

    void deleteByProjetId(String projetId);

    void deleteByUserId(String userId);
}
