package com.pfe.medical.service.impl;

import com.pfe.medical.dto.response.DashboardResponse;
import com.pfe.medical.enums.DossierStatus;
import com.pfe.medical.enums.Role;
import com.pfe.medical.repository.DossierMedicalRepository;
import com.pfe.medical.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final DossierMedicalRepository dossierRepository;
    private final UserRepository userRepository;

    public DashboardResponse getDashboard() {
        long totalApprouves = dossierRepository.countByStatut(DossierStatus.APPROUVE);
        long totalRejetes = dossierRepository.countByStatut(DossierStatus.REJETE);
        long totalEnCours = dossierRepository.countByStatut(DossierStatus.EN_COURS);
        long totalSoumis = dossierRepository.countByStatut(DossierStatus.SOUMIS);
        long totalIncomplets = dossierRepository.countByStatut(DossierStatus.INCOMPLET);
        long totalBrouillons = dossierRepository.countByStatut(DossierStatus.BROUILLON);
        long total = dossierRepository.count();

        BigDecimal totalDemande = dossierRepository.totalMontantDemande();
        BigDecimal totalRembourse = dossierRepository.totalMontantRembourse();

        // Par statut
        Map<String, Long> parStatut = new HashMap<>();
        parStatut.put("BROUILLON", totalBrouillons);
        parStatut.put("SOUMIS", totalSoumis);
        parStatut.put("EN_COURS", totalEnCours);
        parStatut.put("APPROUVE", totalApprouves);
        parStatut.put("REJETE", totalRejetes);
        parStatut.put("INCOMPLET", totalIncomplets);

        // Par mois (données simulées pour démo)
        Map<String, Long> parMois = new HashMap<>();
        String[] mois = {"Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"};
        for (String m : mois) parMois.put(m, 0L);

        double tauxApprobation = total > 0 ? (double) totalApprouves / (totalApprouves + totalRejetes + 0.001) * 100 : 0;

        return DashboardResponse.builder()
                .totalDossiers(total)
                .dossiersEnCours(totalEnCours)
                .dossiersApprouves(totalApprouves)
                .dossiersRejetes(totalRejetes)
                .dossiersIncomplets(totalIncomplets)
                .dossiersSoumis(totalSoumis)
                .totalMontantDemande(totalDemande != null ? totalDemande : BigDecimal.ZERO)
                .totalMontantRembourse(totalRembourse != null ? totalRembourse : BigDecimal.ZERO)
                .totalAssures(userRepository.countByRole(Role.ROLE_ASSURE))
                .totalAgents(userRepository.countByRole(Role.ROLE_AGENT))
                .totalAdmins(userRepository.countByRole(Role.ROLE_ADMIN))
                .assuresActifs(userRepository.countByRoleAndActif(Role.ROLE_ASSURE))
                .dossiersParStatut(parStatut)
                .dossiersParMois(parMois)
                .tauxApprobation(Math.round(tauxApprobation * 10.0) / 10.0)
                .build();
    }
}
