package com.pfe.medical.service.impl;

import com.pfe.medical.dto.request.LoginRequest;
import com.pfe.medical.dto.request.RegisterRequest;
import com.pfe.medical.dto.response.AuthResponse;
import com.pfe.medical.dto.response.UserResponse;
import com.pfe.medical.entity.User;
import com.pfe.medical.enums.Role;
import com.pfe.medical.exception.BusinessException;
import com.pfe.medical.repository.UserRepository;
import com.pfe.medical.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final OtpService otpService;
    private final EmailService emailService;

    /**
     * Étape 1 du flux d'inscription :
     * - Crée le compte avec verified=false, actif=false
     * - Génère un OTP et l'envoie par email
     * - Retourne verificationRequired=true (pas de token JWT)
     */
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Cet email est déjà utilisé.");
        }
        if (request.getCin() != null && userRepository.existsByCin(request.getCin())) {
            throw new BusinessException("Ce CIN est déjà utilisé.");
        }

        Role role = request.getRole() != null ? request.getRole() : Role.ROLE_ASSURE;

        User user = User.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .cin(request.getCin())
                .telephone(request.getTelephone())
                .adresse(request.getAdresse())
                .role(role)
                .actif(false)       // inactif jusqu'à vérification
                .verified(false)    // non vérifié
                .build();

        userRepository.save(user);

        // Générer et envoyer l'OTP par email
        String otpCode = otpService.generateAndStore(request.getEmail());
        emailService.sendOtpEmail(request.getEmail(), request.getPrenom(), otpCode);

        log.info("Compte créé (non vérifié) pour : {} — OTP envoyé", request.getEmail());

        // Retourner sans token JWT : l'utilisateur doit vérifier son email
        return AuthResponse.builder()
                .verificationRequired(true)
                .user(mapToUserResponse(user))
                .build();
    }

    /**
     * Étape 2 du flux d'inscription :
     * - Vérifie le code OTP
     * - Active le compte (verified=true, actif=true)
     * - Retourne le token JWT pour connexion automatique
     */
    public AuthResponse verifyOtp(String email, String code) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        if (user.isVerified()) {
            // Déjà vérifié : générer directement un token
            String token = jwtService.generateToken(user);
            return AuthResponse.builder()
                    .accessToken(token)
                    .tokenType("Bearer")
                    .user(mapToUserResponse(user))
                    .verificationRequired(false)
                    .build();
        }

        if (!otpService.verify(email, code)) {
            throw new BusinessException("Code incorrect ou expiré. Veuillez réessayer.");
        }

        // Activer le compte
        user.setVerified(true);
        user.setActif(true);
        userRepository.save(user);

        log.info("Compte vérifié et activé pour : {}", email);

        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .user(mapToUserResponse(user))
                .verificationRequired(false)
                .build();
    }

    /**
     * Renvoie un nouveau code OTP à l'email donné.
     */
    public void resendOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        if (user.isVerified()) {
            throw new BusinessException("Ce compte est déjà vérifié.");
        }

        String otpCode = otpService.generateAndStore(email);
        emailService.sendOtpEmail(email, user.getPrenom(), otpCode);

        log.info("OTP renvoyé à : {}", email);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));

        if (!user.isActif()) {
            throw new BusinessException("Votre compte est désactivé. Contactez l'administrateur.");
        }

        if (!user.isVerified() && user.getRole() == Role.ROLE_ASSURE) {
            throw new BusinessException("Veuillez vérifier votre email avant de vous connecter.");
        }

        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .user(mapToUserResponse(user))
                .mustChangePassword(user.isMustChangePassword())
                .build();
    }

    public AuthResponse completeVerification(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException("Utilisateur introuvable."));
        if (!user.isVerified()) {
            throw new BusinessException("Email non vérifié.");
        }
        String token = jwtService.generateToken(user);
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .user(mapToUserResponse(user))
                .verificationRequired(false)
                .build();
    }

    public UserResponse mapToUserResponsePublic(User user) {
        return mapToUserResponse(user);
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .cin(user.getCin())
                .telephone(user.getTelephone())
                .adresse(user.getAdresse())
                .role(user.getRole())
                .actif(user.isActif())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
