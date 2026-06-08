package com.pfe.medical.repository;

import com.pfe.medical.entity.HistoriqueAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoriqueActionRepository extends JpaRepository<HistoriqueAction, Long> {
    List<HistoriqueAction> findByDossierIdOrderByCreatedAtDesc(Long dossierId);
    List<HistoriqueAction> findByUtilisateurIdOrderByCreatedAtDesc(Long utilisateurId);
}
