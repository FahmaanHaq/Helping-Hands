package com.helpinghands.application.dto.request;

import com.helpinghands.domain.entity.RequestStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RequestStatusChangeRequest(
        @NotNull RequestStatus status,
        @Size(max = 500) String remarks,
        com.helpinghands.domain.entity.DeliveryMethod deliveryMethod,
        @Size(max = 300) String courierDetails
) {
    /**
     * Convenience constructor for the common case (any transition that
     * isn't a goods delivery update) — no delivery info to carry.
     */
    public RequestStatusChangeRequest(RequestStatus status, String remarks) {
        this(status, remarks, null, null);
    }
}
