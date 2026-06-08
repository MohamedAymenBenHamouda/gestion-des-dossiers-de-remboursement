package com.pfe.medical.service.impl;

import com.pfe.medical.dto.request.RegisterRequest;
import com.pfe.medical.dto.response.UserResponse;
import com.pfe.medical.entity.User;
import com.pfe.medical.enums.Role;
import com.pfe.medical.exception.BusinessException;
import com.pfe.medical.exception.ResourceNotFoundException;
import com.pfe.medical.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public List<UserResponse> getTousUtilisateurs() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<UserResponse> getUtilisateursByRole(Role role) {
        return userRepository.findByRole(role).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUtilisateur(Long id) {
        return mapToResponse(findById(id));
    }

    public UserResponse creerUtilisateur(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email déjà utilisé.");
        }

        User user = User.builder()
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .cin(request.getCin())
                .telephone(request.getTelephone())
                .adresse(request.getAdresse())
                .role(request.getRole() != null ? request.getRole() : Role.ROLE_ASSURE)
                .actif(true)
                .verified(true)
                .mustChangePassword(true)
                .build();

        User savedUser = userRepository.save(user);
        
        emailService.sendAdminCreationEmail(request.getEmail(), request.getPrenom(), request.getPassword());

        return mapToResponse(savedUser);
    }

    public UserResponse activerDesactiver(Long id, boolean actif) {
        User user = findById(id);
        user.setActif(actif);
        return mapToResponse(userRepository.save(user));
    }

    public UserResponse mettreAJour(Long id, RegisterRequest request) {
        User user = findById(id);

        if (!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email déjà utilisé par un autre compte.");
        }

        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setEmail(request.getEmail());
        user.setTelephone(request.getTelephone());
        user.setAdresse(request.getAdresse());
        user.setCin(request.getCin());

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return mapToResponse(userRepository.save(user));
    }

    public void supprimerUtilisateur(Long id) {
        User user = findById(id);
        userRepository.delete(user);
    }

    private User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur", id));
    }

    public UserResponse mapToResponse(User user) {
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
