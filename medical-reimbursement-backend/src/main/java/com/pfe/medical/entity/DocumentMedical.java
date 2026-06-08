package com.pfe.medical.entity;

import com.pfe.medical.enums.AIValidationStatus;
import com.pfe.medical.enums.DocumentType;
import com.pfe.medical.enums.DocumentWorkflowStatus;
import jakarta.persistence.*;
import lombok.*;
import jakarta.persistence.Column;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "documents_medicaux")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class DocumentMedical {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    private DossierMedical dossier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentType type;

    @Column(nullable = false)
    private String nomFichier;

    @Column(nullable = false)
    private String cheminFichier;
    
    @Column(name = "montant_rembourse_ia")
private BigDecimal montantRembourseIA;

@Column(name = "analyse_ia_json", columnDefinition = "TEXT")
private String analyseIAJson;
    private String contentType;

    private Long tailleFichier;

    // AI Analysis results
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AIValidationStatus statutIA = AIValidationStatus.EN_ATTENTE;

    @Column(columnDefinition = "TEXT")
    private String resultatIA;

    private BigDecimal montantDetecteIA;

    private Double scoreConfidenceIA;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime analyseAt;

    @Enumerated(EnumType.STRING)
    private DocumentWorkflowStatus workflowStatus = DocumentWorkflowStatus.UPLOADED;

    @Enumerated(EnumType.STRING)
    private DocumentType typeDetecteIA;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
