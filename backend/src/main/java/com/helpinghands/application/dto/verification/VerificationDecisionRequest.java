package com.helpinghands.application.dto.verification;

import com.helpinghands.domain.entity.VerificationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record VerificationDecisionRequest(
        @NotNull VerificationStatus decision, // expected: APPROVED or REJECTED
        @Size(max = 1000) String rejectionReason,

        // Only relevant for Service Provider decisions; ignored for Children's Homes.
        Boolean policeClearanceVerified
) {
}
