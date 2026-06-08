package com.pfe.medical.dto.response;

import com.pfe.medical.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private UserResponse user;
    private boolean verificationRequired = false;
    private boolean mustChangePassword = false;
}
