package com.pfe.medical.controller;

import com.pfe.medical.dto.request.RegisterRequest;
import com.pfe.medical.dto.response.ApiResponse;
import com.pfe.medical.dto.response.DashboardResponse;
import com.pfe.medical.dto.response.DossierResponse;
import com.pfe.medical.dto.response.UserResponse;
import com.pfe.medical.enums.DossierStatus;
import com.pfe.medical.enums.Role;
import com.pfe.medical.exception.BusinessException;
import com.pfe.medical.repository.UserRepository;
import com.pfe.medical.service.impl.DashboardService;
import com.pfe.medical.service.impl.DossierService;
import com.pfe.medical.service.impl.UserService;
import jakarta.validation.Valid;
import lombok.Data;
import com.pfe.medical.entity.User;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    private final DossierService dossierService;
    private final DashboardService dashboardService;

    // === DASHBOARD ===

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getDashboard()));
    }

    // === GESTION UTILISATEURS ===

    @GetMapping("/utilisateurs")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getTousUtilisateurs() {
        return ResponseEntity.ok(ApiResponse.success(userService.getTousUtilisateurs()));
    }

    @GetMapping("/utilisateurs/agents")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAgents() {
        return ResponseEntity.ok(ApiResponse.success(userService.getUtilisateursByRole(Role.ROLE_AGENT)));
    }

    @GetMapping("/utilisateurs/assures")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAssures() {
        return ResponseEntity.ok(ApiResponse.success(userService.getUtilisateursByRole(Role.ROLE_ASSURE)));
    }

    @GetMapping("/utilisateurs/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUtilisateur(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUtilisateur(id)));
    }

    @PostMapping("/utilisateurs")
    public ResponseEntity<ApiResponse<UserResponse>> creerUtilisateur(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Utilisateur créé.", userService.creerUtilisateur(request)));
    }

    @PutMapping("/utilisateurs/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> mettreAJour(
            @PathVariable Long id,
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Utilisateur mis à jour.", userService.mettreAJour(id, request)));
    }

    @PatchMapping("/utilisateurs/{id}/activer")
    public ResponseEntity<ApiResponse<UserResponse>> activer(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Compte activé.", userService.activerDesactiver(id, true)));
    }

    @PatchMapping("/utilisateurs/{id}/desactiver")
    public ResponseEntity<ApiResponse<UserResponse>> desactiver(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Compte désactivé.", userService.activerDesactiver(id, false)));
    }

    @DeleteMapping("/utilisateurs/{id}")
    public ResponseEntity<ApiResponse<Void>> supprimerUtilisateur(@PathVariable Long id) {
        userService.supprimerUtilisateur(id);
        return ResponseEntity.ok(ApiResponse.success("Utilisateur supprimé.", null));
    }

    // === GESTION DOSSIERS ===

    @GetMapping("/dossiers")
    public ResponseEntity<ApiResponse<Page<DossierResponse>>> getTousDossiers(
            @RequestParam(required = false) DossierStatus statut,
            @RequestParam(required = false) Long assureId,
            @RequestParam(required = false) Long agentId,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        Page<DossierResponse> dossiers = dossierService.getTousDossiers(statut, assureId, agentId, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(dossiers));
    }

    @GetMapping("/dossiers/{id}")
    public ResponseEntity<ApiResponse<DossierResponse>> getDossier(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(dossierService.getDossier(id)));
    }
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
        if (!request.getNouveauMotDePasse().matches(
                "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{12,}$")) {
            throw new BusinessException(
                "Le mot de passe doit contenir au moins 12 caractères, " +
                "une majuscule, une minuscule, un chiffre et un caractère spécial");
        }
        u.setPassword(passwordEncoder.encode(request.getNouveauMotDePasse()));
        u.setMustChangePassword(false);
        userRepository.save(u);
        return ResponseEntity.ok(ApiResponse.success(
                "Mot de passe changé avec succès.", null));
    }

    // ✅ AJOUTER ces classes internes
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
