package com.pfe.medical.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardResponse {
    // Compteurs dossiers
    private long totalDossiers;
    private long dossiersEnCours;
    private long dossiersApprouves;
    private long dossiersRejetes;
    private long dossiersIncomplets;
    private long dossiersSoumis;

    // Montants
    private BigDecimal totalMontantDemande;
    private BigDecimal totalMontantRembourse;

    // Utilisateurs
    private long totalAssures;
    private long totalAgents;
    private long totalAdmins;
    private long assuresActifs;

    // Stats par mois
    private Map<String, Long> dossiersParMois;

    // Stats par statut
    private Map<String, Long> dossiersParStatut;

    // Taux d'approbation
    private double tauxApprobation;
}
