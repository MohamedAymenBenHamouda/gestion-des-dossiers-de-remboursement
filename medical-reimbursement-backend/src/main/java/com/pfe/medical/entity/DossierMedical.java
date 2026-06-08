package com.pfe.medical.entity;

import com.pfe.medical.enums.DossierStatus;
import com.pfe.medical.enums.TypeSoin;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "dossiers_medicaux")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DossierMedical {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String numeroDossier;

    @Column(nullable = false)
    private String description;

    private String motif;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DossierStatus statut = DossierStatus.BROUILLON;

    @Enumerated(EnumType.STRING)
    private TypeSoin typeSoin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assure_id", nullable = false)
    private User assure;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private User agent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "beneficiary_id")
    private com.pfe.medical.entity.FamilyMember beneficiary;

    // Montants
    private BigDecimal montantTotal;
    private BigDecimal montantRembourse;
    private BigDecimal montantCalculeIA;

    // Message agent en cas de dossier incomplet
    @Column(columnDefinition = "TEXT")
    private String messageAgent;

    // Note de rejet
    @Column(columnDefinition = "TEXT")
    private String noteRejet;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime dateSoumission;
    private LocalDateTime dateValidation;

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DocumentMedical> documents = new ArrayList<>();

    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<HistoriqueAction> historiques = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (numeroDossier == null) {
            numeroDossier = "DOS-" + System.currentTimeMillis();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
