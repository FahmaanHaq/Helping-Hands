package com.helpinghands.application.dto.childrenshome;

import com.helpinghands.domain.entity.VerificationStatus;

import java.time.LocalDateTime;

public record ChildrensHomeResponse(
        Long id,
        String homeName,
        String registrationNumber,
        String contactNumber,
        String contactEmail,
        String address,
        String description,
        VerificationStatus verificationStatus,
        String rejectionReason,
        String reviewedBy,
        LocalDateTime reviewedDate,
        Integer resubmissionCount,
        Integer resubmissionsRemaining,
        LocalDateTime createdDate
) {
}
