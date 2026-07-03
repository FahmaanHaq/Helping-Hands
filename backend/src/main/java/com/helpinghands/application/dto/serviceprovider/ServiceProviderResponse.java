package com.helpinghands.application.dto.serviceprovider;

import com.helpinghands.domain.entity.ServiceCategory;
import com.helpinghands.domain.entity.ServiceMode;
import com.helpinghands.domain.entity.VerificationStatus;

import java.time.LocalDateTime;
import java.util.Set;

public record ServiceProviderResponse(
        Long id,
        String skills,
        String qualifications,
        Set<ServiceCategory> serviceCategories,
        ServiceMode serviceMode,
        boolean policeClearanceRequired,
        boolean policeClearanceVerified,
        VerificationStatus verificationStatus,
        String rejectionReason,
        String reviewedBy,
        LocalDateTime reviewedDate,
        Integer resubmissionCount,
        Integer resubmissionsRemaining,
        LocalDateTime createdDate
) {
}
