package com.mmea.mallos.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String message;
    private String token;
    private Long id;
    private String username;
    private String email;
    private String role;
    private boolean authenticated;
    private Long mallId;
    private String fullName;
    private String phone;
    private String avatar;
    private String createdAt;
    private String lastLogin;
}
