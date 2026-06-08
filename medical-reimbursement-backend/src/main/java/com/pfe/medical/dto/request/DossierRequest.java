package com.pfe.medical.dto.request;

import com.pfe.medical.enums.TypeSoin;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DossierRequest {
    @NotBlank
    private String description;
    private String motif;
    private TypeSoin typeSoin;
    // facultatif : si null la personne bénéficiaire est l'assuré lui-même
    private Long beneficiaryId;
}
