package tn.fst.eventservice.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.fst.eventservice.entity.Event;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends MongoRepository<Event, String> {

    List<Event> findByOrganisateur(String email);

    List<Event> findByParticipantsContaining(String email);

    List<Event> findByDateHeureAfter(LocalDateTime date);

    List<Event> findAllByOrderByDateHeureDesc();
}
