package tn.fst.projectservice.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import tn.fst.projectservice.entity.Projet;
import tn.fst.projectservice.entity.StatusApprobation;
import tn.fst.projectservice.entity.StatusProjet;
import tn.fst.projectservice.entity.VisibiliteProjet;

import java.util.List;

public interface ProjetRepository extends MongoRepository<Projet, String> {
    List<Projet> findByChefProjet(String chefProjet);
    List<Projet> findByMembresContaining(String email);
    List<Projet> findByOrganisation(String organisation);
    List<Projet> findByStatus(StatusProjet status);
    List<Projet> findByApprobation(StatusApprobation approbation);
    List<Projet> findByVisibilite(VisibiliteProjet visibilite);
}
