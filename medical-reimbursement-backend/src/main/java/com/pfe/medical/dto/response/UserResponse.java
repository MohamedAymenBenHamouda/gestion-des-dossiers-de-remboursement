package com.pfe.medical.dto.response;

import com.pfe.medical.enums.Role;
import lombok.*;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String cin;
    private String telephone;
    private String adresse;
    private Role role;
    private boolean actif;
    private LocalDateTime createdAt;
}
