package com.pfe.medical.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AgentValidationRequest {
    @NotNull
    private boolean approuve;

    private String note;

    // Si approuvé, l'agent peut ajuster le montant
    private BigDecimal montantRembourse;

    // Si incomplet, message pour l'assuré
    private String messageCompletion;
}
