package com.pfe.medical.dto.response;

import com.pfe.medical.enums.DossierStatus;
import com.pfe.medical.enums.TypeSoin;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DossierResponse {
    private Long id;
    private String numeroDossier;
    private String description;
    private String motif;
    private TypeSoin typeSoin;
    private DossierStatus statut;
    private UserResponse assure;
    private UserResponse agent;
    private BigDecimal montantTotal;
    private BigDecimal montantRembourse;
    private BigDecimal montantCalculeIA;
    private String messageAgent;
    private String noteRejet;
    private LocalDateTime createdAt;
    private LocalDateTime dateSoumission;
    private LocalDateTime dateValidation;
    private List<DocumentResponse> documents;
    private com.pfe.medical.dto.response.FamilyMemberResponse beneficiary;
}
