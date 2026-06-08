package com.pfe.medical.controller;

import com.pfe.medical.dto.request.AgentValidationRequest;
import com.pfe.medical.dto.response.ApiResponse;
import com.pfe.medical.dto.response.DossierResponse;
import com.pfe.medical.entity.User;
import com.pfe.medical.enums.DossierStatus;
import com.pfe.medical.exception.BusinessException;
import com.pfe.medical.repository.HistoriqueActionRepository;
import com.pfe.medical.repository.UserRepository;
import com.pfe.medical.service.impl.DossierService;
import com.pfe.medical.service.impl.NotificationService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/agent")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
public class AgentController {

    private final DossierService dossierService;
    private final NotificationService notificationService;
    private final HistoriqueActionRepository historiqueRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/dossiers")
    public ResponseEntity<ApiResponse<Page<DossierResponse>>> getDossiers(
            @RequestParam(required = false) DossierStatus statut,
            @RequestParam(required = false) Long assureId,
            @AuthenticationPrincipal User agent,
            Pageable pageable) {
        Page<DossierResponse> dossiers = dossierService.getTousDossiers(statut, assureId, agent.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(dossiers));
    }

    @GetMapping("/dossiers/soumis")
    public ResponseEntity<ApiResponse<Page<DossierResponse>>> getDossiersSoumis(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(dossierService.getDossiersSoumis(pageable)));
    }

    @GetMapping("/dossiers/{id}")
    public ResponseEntity<ApiResponse<DossierResponse>> getDossier(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(dossierService.getDossier(id)));
    }

    @PostMapping("/dossiers/{id}/prendre-en-charge")
    public ResponseEntity<ApiResponse<DossierResponse>> prendreEnCharge(
            @PathVariable Long id,
            @AuthenticationPrincipal User agent) {
        DossierResponse response = dossierService.prendreEnCharge(id, agent.getId());
        return ResponseEntity.ok(ApiResponse.success("Dossier pris en charge.", response));
    }

    @PostMapping("/dossiers/{id}/valider")
    public ResponseEntity<ApiResponse<DossierResponse>> valider(
            @PathVariable Long id,
            @Valid @RequestBody AgentValidationRequest request,
            @AuthenticationPrincipal User agent) {
        DossierResponse response = dossierService.validerDossier(id, request, agent.getId());
        return ResponseEntity.ok(ApiResponse.success("Dossier traité avec succès.", response));
    }

    @GetMapping("/dossiers/{id}/historique")
    public ResponseEntity<ApiResponse<?>> getHistorique(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(
                historiqueRepository.findByDossierIdOrderByCreatedAtDesc(id)));
    }

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<?>> getNotifications(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getNotificationsUtilisateur(user.getId())));
    }

    @PatchMapping("/notifications/{notifId}/lire")
    public ResponseEntity<ApiResponse<Void>> marquerLue(@PathVariable Long notifId) {
        notificationService.marquerCommeLue(notifId);
        return ResponseEntity.ok(ApiResponse.success("Notification lue.", null));
    }

    // ============================================================
    // PROFIL
    // ============================================================

    @PutMapping("/profil")
    public ResponseEntity<ApiResponse<Void>> updateProfil(
            @AuthenticationPrincipal User user,
            @RequestBody UpdateProfilRequest request) {
        User u = userRepository.findById(user.getId())
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        if (request.getPrenom() != null) u.setPrenom(request.getPrenom());
        if (request.getNom() != null) u.setNom(request.getNom());
        if (request.getTelephone() != null) u.setTelephone(request.getTelephone());
        if (request.getCin() != null) u.setCin(request.getCin());
        if (request.getAdresse() != null) u.setAdresse(request.getAdresse());
        userRepository.save(u);
        return ResponseEntity.ok(ApiResponse.success("Profil mis à jour.", null));
    }

    @PostMapping("/profil/changer-mot-de-passe")
    public ResponseEntity<ApiResponse<Void>> changerMotDePasse(
            @AuthenticationPrincipal User user,
            @RequestBody ChangerMotDePasseRequest request) {
        User u = userRepository.findById(user.getId())
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        if (!passwordEncoder.matches(request.getAncienMotDePasse(), u.getPassword())) {
            throw new BusinessException("Mot de passe actuel incorrect.");
        }
        if (!request.getNouveauMotDePasse().matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{12,}$")) {
            throw new BusinessException("Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial");
        }
        u.setPassword(passwordEncoder.encode(request.getNouveauMotDePasse()));
        u.setMustChangePassword(false);
        userRepository.save(u);
        return ResponseEntity.ok(ApiResponse.success("Mot de passe changé avec succès.", null));
    }

    @Data
    static class UpdateProfilRequest {
        private String prenom;
        private String nom;
        private String telephone;
        private String cin;
        private String adresse;
    }

    @Data
    static class ChangerMotDePasseRequest {
        private String ancienMotDePasse;
        private String nouveauMotDePasse;
    }
}
