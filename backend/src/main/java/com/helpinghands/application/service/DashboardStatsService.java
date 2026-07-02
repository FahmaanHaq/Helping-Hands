package com.helpinghands.application.service;

import com.helpinghands.application.dto.dashboard.VerificationStatsResponse;
import com.helpinghands.domain.entity.VerificationStatus;
import com.helpinghands.infrastructure.repository.ChildrensHomeRepository;
import com.helpinghands.infrastructure.repository.ServiceProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardStatsService {

    private final ChildrensHomeRepository childrensHomeRepository;
    private final ServiceProviderRepository serviceProviderRepository;

    @Transactional(readOnly = true)
    public VerificationStatsResponse getVerificationStats() {
        return new VerificationStatsResponse(
                childrensHomeRepository.countByVerificationStatus(VerificationStatus.SUBMITTED),
                childrensHomeRepository.countByVerificationStatus(VerificationStatus.UNDER_REVIEW),
                childrensHomeRepository.countByVerificationStatus(VerificationStatus.APPROVED),
                childrensHomeRepository.countByVerificationStatus(VerificationStatus.REJECTED),
                serviceProviderRepository.countByVerificationStatus(VerificationStatus.SUBMITTED),
                serviceProviderRepository.countByVerificationStatus(VerificationStatus.UNDER_REVIEW),
                serviceProviderRepository.countByVerificationStatus(VerificationStatus.APPROVED),
                serviceProviderRepository.countByVerificationStatus(VerificationStatus.REJECTED)
        );
    }
}
