package com.pfe.medical.dto.request;

import com.pfe.medical.enums.Role;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String nom;

    @NotBlank
    private String prenom;

    @NotBlank @Email
    private String email;

    @NotBlank
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{12,}$",
            message = "Le mot de passe doit contenir au moins 12 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial")
    private String password;

    private String cin;
    private String telephone;
    private String adresse;

    // Optionnel, défaut = ROLE_ASSURE
    private Role role;
}
