package com.helpinghands.application.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FlagRequestRequest(
        @NotNull Boolean flagged,
        @Size(max = 500) String reason
) {
}
