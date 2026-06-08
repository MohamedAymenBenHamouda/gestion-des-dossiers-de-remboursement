package com.pfe.medical.controller;

import com.pfe.medical.dto.request.LoginRequest;
import com.pfe.medical.dto.request.RegisterRequest;
import com.pfe.medical.dto.request.ResendRequest;
import com.pfe.medical.dto.request.VerificationRequest;
import com.pfe.medical.dto.response.ApiResponse;
import com.pfe.medical.dto.response.AuthResponse;
import com.pfe.medical.service.impl.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Étape 1 : Inscription — crée le compte et envoie l'OTP par email.
     * Retourne verificationRequired=true.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Compte créé. Un code de vérification a été envoyé à votre email.", response));
    }

    /**
     * Étape 2 : Vérification OTP — valide le code, active le compte et retourne le JWT.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(@Valid @RequestBody VerificationRequest request) {
        AuthResponse response = authService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.success("Email vérifié avec succès. Bienvenue !", response));
    }

    /**
     * Renvoie un nouveau code OTP à l'email donné.
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Void>> resendOtp(@Valid @RequestBody ResendRequest request) {
        authService.resendOtp(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Un nouveau code a été envoyé à votre email.", null));
    }

    /**
     * Connexion — retourne le JWT si les identifiants sont corrects et le compte est vérifié.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Connexion réussie.", response));
    }
}
