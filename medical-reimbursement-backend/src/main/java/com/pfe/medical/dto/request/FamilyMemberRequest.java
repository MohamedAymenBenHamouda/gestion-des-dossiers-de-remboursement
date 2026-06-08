package com.pfe.medical.dto.request;

import lombok.Data;

import lombok.Data;

@Data
public class FamilyMemberRequest {
    private String nom;
    private String prenom;
    private String relation;
    // accept date as string in multiple formats (e.g. yyyy-MM-dd or dd-MM-yyyy)
    private String dateNaissance;
}
