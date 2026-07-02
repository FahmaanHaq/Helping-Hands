package com.helpinghands.application.dto;

import java.util.List;

public record AuthResponse(
        String accessToken,
        String tokenType,
        Long userId,
        String username,
        List<String> roles,
        Boolean emailVerified,
        Boolean mfaRequired
) {
    public AuthResponse(String accessToken, Long userId, String username, List<String> roles, Boolean emailVerified) {
        this(accessToken, "Bearer", userId, username, roles, emailVerified, false);
    }

    /**
     * Returned instead of a real token when the account requires MFA — the
     * frontend must call /auth/verify-mfa with the emailed code to get an
     * actual accessToken. Intentionally carries almost nothing else: a
     * partially-authenticated response shouldn't leak roles or claim to be
     * a valid session.
     */
    public static AuthResponse mfaRequired(Long userId) {
        return new AuthResponse(null, null, userId, null, null, null, true);
    }
}
