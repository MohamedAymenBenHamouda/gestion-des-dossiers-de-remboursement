package com.pfe.medical.controller;

import com.pfe.medical.dto.request.DossierRequest;
import com.pfe.medical.dto.response.ApiResponse;
import com.pfe.medical.dto.response.DocumentResponse;
import com.pfe.medical.dto.response.DossierResponse;
import com.pfe.medical.entity.User;
import com.pfe.medical.enums.DocumentType;
import com.pfe.medical.exception.BusinessException;
import com.pfe.medical.repository.UserRepository;
import com.pfe.medical.service.impl.DossierService;
import com.pfe.medical.service.impl.NotificationService;
import jakarta.validation.Valid;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/assure")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ASSURE')")
public class AssureController {

    private final DossierService dossierService;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.pfe.medical.service.impl.FamilyMemberService familyMemberService;

    // === DOSSIERS ===

    @PostMapping("/dossiers")
    public ResponseEntity<ApiResponse<DossierResponse>> creerDossier(
            @Valid @RequestBody DossierRequest request,
            @AuthenticationPrincipal User user) {
        DossierResponse response = dossierService.creerDossier(request, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Dossier créé avec succès.", response));
    }

    @GetMapping("/dossiers")
    public ResponseEntity<ApiResponse<Page<DossierResponse>>> mesDossiers(
            @AuthenticationPrincipal User user,
            Pageable pageable) {
        Page<DossierResponse> dossiers = dossierService.getDossiersAssure(user.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success(dossiers));
    }

    @GetMapping("/dossiers/{id}")
    public ResponseEntity<ApiResponse<DossierResponse>> getDossier(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(dossierService.getDossier(id)));
    }

    @PutMapping("/dossiers/{id}")
    public ResponseEntity<ApiResponse<DossierResponse>> updateDossier(
            @PathVariable Long id,
            @RequestBody DossierRequest request,
            @AuthenticationPrincipal User user) {
        DossierResponse response = dossierService.updateDossier(id, request, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Dossier mis à jour.", response));
    }

    @PostMapping("/dossiers/{id}/soumettre")
    public ResponseEntity<ApiResponse<DossierResponse>> soumettre(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        DossierResponse response = dossierService.soumettreDossier(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Dossier soumis avec succès.", response));
    }

    // === DOCUMENTS ===

    @PostMapping(value = "/dossiers/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponse>> ajouterDocument(
            @PathVariable Long id,
            @RequestParam("fichier") MultipartFile fichier,
            @RequestParam("type") DocumentType type,
            @AuthenticationPrincipal User user) {
        DocumentResponse response = dossierService.ajouterDocument(id, fichier, type, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Document ajouté et analyse IA en cours.", response));
    }

    @GetMapping("/dossiers/{id}/documents")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getDocuments(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(dossierService.getDocumentsDossier(id)));
    }

    // === FAMILLE ===
    @GetMapping("/famille")
    public ResponseEntity<ApiResponse<List<com.pfe.medical.dto.response.FamilyMemberResponse>>> listFamille(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(familyMemberService.listForUser(user.getId())));
    }

    @PostMapping("/famille")
    public ResponseEntity<ApiResponse<com.pfe.medical.dto.response.FamilyMemberResponse>> ajouterMembreFamille(
            @AuthenticationPrincipal User user,
            @RequestBody com.pfe.medical.dto.request.FamilyMemberRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Membre ajouté.", familyMemberService.add(user.getId(), request)));
    }

    @DeleteMapping("/famille/{id}")
    public ResponseEntity<ApiResponse<Void>> supprimerMembreFamille(@AuthenticationPrincipal User user, @PathVariable Long id) {
        familyMemberService.remove(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Membre supprimé.", null));
    }

    // === NOTIFICATIONS ===

    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<?>> getNotifications(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getNotificationsUtilisateur(user.getId())));
    }

    @GetMapping("/notifications/non-lues")
    public ResponseEntity<ApiResponse<?>> getNotificationsNonLues(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.getNotificationsNonLues(user.getId())));
    }

    @GetMapping("/notifications/count")
    public ResponseEntity<ApiResponse<Long>> countNonLues(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationService.countNonLues(user.getId())));
    }

    @PatchMapping("/notifications/{id}/lire")
    public ResponseEntity<ApiResponse<Void>> marquerLue(@PathVariable Long id) {
        notificationService.marquerCommeLue(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marquée comme lue.", null));
    }

    @PatchMapping("/notifications/lire-toutes")
    public ResponseEntity<ApiResponse<Void>> marquerToutesLues(@AuthenticationPrincipal User user) {
        notificationService.marquerToutesCommeLues(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Toutes les notifications marquées comme lues.", null));
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
