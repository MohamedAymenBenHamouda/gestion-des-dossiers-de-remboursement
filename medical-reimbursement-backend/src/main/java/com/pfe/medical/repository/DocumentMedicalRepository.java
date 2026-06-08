package com.pfe.medical.repository;

import com.pfe.medical.entity.DocumentMedical;
import com.pfe.medical.enums.AIValidationStatus;
import com.pfe.medical.enums.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentMedicalRepository extends JpaRepository<DocumentMedical, Long> {
    List<DocumentMedical> findByDossierId(Long dossierId);
    List<DocumentMedical> findByDossierIdAndType(Long dossierId, DocumentType type);
    List<DocumentMedical> findByStatutIA(AIValidationStatus statutIA);
    long countByDossierIdAndStatutIA(Long dossierId, AIValidationStatus statutIA);
}
