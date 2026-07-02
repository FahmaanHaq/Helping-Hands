package com.helpinghands.application.dto.admin;

import java.time.LocalDateTime;
import java.util.List;

public record UserSummaryResponse(
        Long id,
        String fullName,
        String username,
        String email,
        List<String> roles,
        Boolean accountLocked,
        String suspensionReason,
        LocalDateTime createdDate
) {
}
