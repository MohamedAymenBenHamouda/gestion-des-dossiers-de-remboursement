package com.pfe.medical.repository;

import com.pfe.medical.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByDestinataireIdOrderByCreatedAtDesc(Long destinataireId);
    List<Notification> findByDestinataireIdAndLuFalseOrderByCreatedAtDesc(Long destinataireId);
    long countByDestinataireIdAndLuFalse(Long destinataireId);

    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.lu = true, n.luAt = CURRENT_TIMESTAMP WHERE n.destinataire.id = :userId")
    void markAllAsRead(@Param("userId") Long userId);
}
