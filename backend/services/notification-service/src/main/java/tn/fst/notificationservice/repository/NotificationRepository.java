package tn.fst.notificationservice.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import tn.fst.notificationservice.entity.Notification;

import java.util.List;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    List<Notification> findByUserIdOrderByTimestampDesc(String userId);

    List<Notification> findByUserIdAndLuOrderByTimestampDesc(String userId, boolean lu);

    long countByUserIdAndLu(String userId, boolean lu);
}
