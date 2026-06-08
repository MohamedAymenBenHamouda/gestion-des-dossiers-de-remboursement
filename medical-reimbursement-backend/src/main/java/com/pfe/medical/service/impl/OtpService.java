package com.pfe.medical.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service de gestion des OTP (One-Time Password) pour la vérification par email.
 * Stockage en mémoire avec nettoyage automatique des codes expirés.
 */
@Service
public class OtpService {

    @Value("${app.otp.expiration-minutes:10}")
    private int expirationMinutes;

    private static final SecureRandom RANDOM = new SecureRandom();

    /** Stockage : email → (code, expiration) */
    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();

    /**
     * Génère un OTP à 6 chiffres, le stocke avec expiration et retourne le code.
     */
    public String generateAndStore(String email) {
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(expirationMinutes);
        otpStore.put(email.toLowerCase(), new OtpEntry(code, expiry));
        return code;
    }

    /**
     * Vérifie si le code fourni est valide pour cet email.
     * Supprime l'OTP après vérification réussie.
     *
     * @return true si le code est correct et non expiré
     */
    public boolean verify(String email, String code) {
        OtpEntry entry = otpStore.get(email.toLowerCase());
        if (entry == null) return false;
        if (LocalDateTime.now().isAfter(entry.expiry())) {
            otpStore.remove(email.toLowerCase());
            return false;
        }
        if (!entry.code().equals(code)) return false;
        otpStore.remove(email.toLowerCase());
        return true;
    }

    /**
     * Vérifie si un OTP actif existe pour cet email (sans le valider).
     */
    public boolean hasActiveOtp(String email) {
        OtpEntry entry = otpStore.get(email.toLowerCase());
        if (entry == null) return false;
        if (LocalDateTime.now().isAfter(entry.expiry())) {
            otpStore.remove(email.toLowerCase());
            return false;
        }
        return true;
    }

    /**
     * Nettoyage automatique toutes les 5 minutes des OTP expirés.
     */
    @Scheduled(fixedDelay = 300_000)
    public void cleanExpiredOtps() {
        LocalDateTime now = LocalDateTime.now();
        otpStore.entrySet().removeIf(e -> now.isAfter(e.getValue().expiry()));
    }

    private record OtpEntry(String code, LocalDateTime expiry) {}
}
