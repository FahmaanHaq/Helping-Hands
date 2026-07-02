package com.helpinghands.application.dto;

import com.helpinghands.domain.entity.RoleName;
import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank @Size(max = 150) String fullName,
        @NotBlank @Size(max = 60) String username,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @Size(max = 20) String phoneNumber,
        @NotNull RoleName role
) {
}
