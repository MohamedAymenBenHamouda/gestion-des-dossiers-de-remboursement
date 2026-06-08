package com.pfe.medical.service.impl;

import com.pfe.medical.entity.Notification;
import com.pfe.medical.entity.User;
import com.pfe.medical.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final JavaMailSender mailSender;

    public Notification creerNotification(User destinataire, String titre, String message, String type, Long dossierId) {
        Notification notif = Notification.builder()
                .destinataire(destinataire)
                .titre(titre)
                .message(message)
                .type(type)
                .dossierIdRef(dossierId)
                .lu(false)
                .build();
        return notificationRepository.save(notif);
    }

    public List<Notification> getNotificationsUtilisateur(Long userId) {
        return notificationRepository.findByDestinataireIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getNotificationsNonLues(Long userId) {
        return notificationRepository.findByDestinataireIdAndLuFalseOrderByCreatedAtDesc(userId);
    }

    public long countNonLues(Long userId) {
        return notificationRepository.countByDestinataireIdAndLuFalse(userId);
    }

    public void marquerCommeLue(Long notifId) {
        notificationRepository.findById(notifId).ifPresent(n -> {
            n.setLu(true);
            n.setLuAt(LocalDateTime.now());
            notificationRepository.save(n);
        });
    }

    public void marquerToutesCommeLues(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Async
    public void envoyerEmail(String destinataire, String sujet, String corps) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(destinataire);
            message.setSubject(sujet);
            message.setText(corps);
            mailSender.send(message);
        } catch (Exception e) {
            // Log error but don't break the flow
            System.err.println("Erreur envoi email: " + e.getMessage());
        }
    }
}
