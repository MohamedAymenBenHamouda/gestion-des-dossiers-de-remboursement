package com.pfe.medical.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class VerifyRequest {
    @NotBlank @Email
    private String email;

    @NotBlank
    private String code;
}
