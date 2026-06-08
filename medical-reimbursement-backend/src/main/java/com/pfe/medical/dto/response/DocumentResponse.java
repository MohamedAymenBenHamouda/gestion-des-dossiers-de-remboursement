package com.pfe.medical.dto.response;

import com.pfe.medical.enums.AIValidationStatus;
import com.pfe.medical.enums.DocumentType;
import com.pfe.medical.enums.DocumentWorkflowStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DocumentResponse {
    private Long id;
    private DocumentType type;
    private DocumentType typeDetecteIA;
    private DocumentWorkflowStatus workflowStatus;
    private String nomFichier;
    private String contentType;
    private Long tailleFichier;
    private AIValidationStatus statutIA;
    private String resultatIA;
    private BigDecimal montantDetecteIA;
    private BigDecimal montantRembourseIA;
    private Double scoreConfidenceIA;
    private LocalDateTime createdAt;
    private LocalDateTime analyseAt;

    private AnalyseIAResult analyseIA;
}
