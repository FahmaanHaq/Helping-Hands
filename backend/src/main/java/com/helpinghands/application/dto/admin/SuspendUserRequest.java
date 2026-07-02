package com.helpinghands.application.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SuspendUserRequest(
        @NotBlank @Size(max = 500) String reason
) {
}
