package com.pfe.medical.repository;

import com.pfe.medical.entity.DossierMedical;
import com.pfe.medical.enums.DossierStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DossierMedicalRepository extends JpaRepository<DossierMedical, Long> {

    Optional<DossierMedical> findByNumeroDossier(String numeroDossier);

    // Pour l'assuré
    Page<DossierMedical> findByAssureId(Long assureId, Pageable pageable);
    List<DossierMedical> findByAssureId(Long assureId);
    List<DossierMedical> findByAssureIdAndStatut(Long assureId, DossierStatus statut);

    // Pour l'agent
    Page<DossierMedical> findByAgentId(Long agentId, Pageable pageable);
    List<DossierMedical> findByAgentId(Long agentId);
    List<DossierMedical> findByStatutIn(List<DossierStatus> statuts);

    // Pagination avec filtres
    Page<DossierMedical> findByStatut(DossierStatus statut, Pageable pageable);

    @Query("SELECT d FROM DossierMedical d WHERE " +
           "(:statut IS NULL OR d.statut = :statut) AND " +
           "(:assureId IS NULL OR d.assure.id = :assureId) AND " +
           "(:agentId IS NULL OR d.agent.id = :agentId) AND " +
           "(:search IS NULL OR :search = '' OR " +
           " LOWER(d.numeroDossier) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(d.assure.nom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(d.assure.prenom) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(d.motif) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(d.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<DossierMedical> findWithFilters(
        @Param("statut") DossierStatus statut,
        @Param("assureId") Long assureId,
        @Param("agentId") Long agentId,
        @Param("search") String search,
        Pageable pageable
    );

    // Dashboard stats
    long countByStatut(DossierStatus statut);

    @Query("SELECT COUNT(d) FROM DossierMedical d WHERE d.createdAt >= :debut")
    long countDossiersSince(@Param("debut") LocalDateTime debut);

    @Query("SELECT SUM(d.montantRembourse) FROM DossierMedical d WHERE d.statut = 'APPROUVE'")
    BigDecimal totalMontantRembourse();

    @Query("SELECT SUM(d.montantTotal) FROM DossierMedical d WHERE d.statut = 'APPROUVE'")
    BigDecimal totalMontantDemande();

    @Query("SELECT d.statut, COUNT(d) FROM DossierMedical d GROUP BY d.statut")
    List<Object[]> countGroupByStatut();

    @Query("SELECT MONTH(d.createdAt), COUNT(d) FROM DossierMedical d " +
           "WHERE YEAR(d.createdAt) = YEAR(CURRENT_DATE) GROUP BY MONTH(d.createdAt)")
    List<Object[]> countByMonth();

    // Dossiers soumis non encore assignés
    List<DossierMedical> findByStatutAndAgentIsNull(DossierStatus statut);
}
