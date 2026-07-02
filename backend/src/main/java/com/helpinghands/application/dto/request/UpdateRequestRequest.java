package com.helpinghands.application.dto.request;

import com.helpinghands.domain.entity.UrgencyLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UpdateRequestRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @Positive Integer quantity,
        UrgencyLevel urgency
) {
}
