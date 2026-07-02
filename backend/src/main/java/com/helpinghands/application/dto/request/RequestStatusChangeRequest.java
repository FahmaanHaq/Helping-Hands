package com.helpinghands.application.dto.request;

import com.helpinghands.domain.entity.RequestStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RequestStatusChangeRequest(
        @NotNull RequestStatus status,
        @Size(max = 500) String remarks
) {
}
