package com.pfe.medical.dto.response;

import lombok.*;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyMemberResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String relation;
    private LocalDate dateNaissance;
}
