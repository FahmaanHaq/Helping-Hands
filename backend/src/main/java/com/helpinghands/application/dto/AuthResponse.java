package com.helpinghands.application.dto;

import java.util.List;

public record AuthResponse(
        String accessToken,
        String tokenType,
        Long userId,
        String username,
        List<String> roles
) {
    public AuthResponse(String accessToken, Long userId, String username, List<String> roles) {
        this(accessToken, "Bearer", userId, username, roles);
    }
}
