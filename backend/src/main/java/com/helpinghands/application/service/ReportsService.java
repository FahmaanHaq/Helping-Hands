package com.helpinghands.application.service;

import com.helpinghands.application.dto.reports.ReportsSummaryResponse;
import com.helpinghands.domain.entity.RequestStatus;
import com.helpinghands.domain.entity.RequestType;
import com.helpinghands.domain.entity.RoleName;
import com.helpinghands.infrastructure.repository.RatingRepository;
import com.helpinghands.infrastructure.repository.RequestRepository;
import com.helpinghands.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportsService {

    private final RequestRepository requestRepository;
    private final UserRepository userRepository;
    private final RatingRepository ratingRepository;

    @Transactional(readOnly = true)
    public ReportsSummaryResponse getSummary() {
        long active = requestRepository.countByStatus(RequestStatus.CREATED)
                + requestRepository.countByStatus(RequestStatus.PLEDGED)
                + requestRepository.countByStatus(RequestStatus.ACCEPTED)
                + requestRepository.countByStatus(RequestStatus.IN_PROGRESS)
                + requestRepository.countByStatus(RequestStatus.DELIVERED);

        return new ReportsSummaryResponse(
                requestRepository.countByRequestType(RequestType.GOODS),
                requestRepository.countByRequestType(RequestType.SERVICE),
                active,
                requestRepository.countByStatus(RequestStatus.COMPLETED),
                requestRepository.countByStatus(RequestStatus.CANCELLED),
                userRepository.countByRoleName(RoleName.DONOR),
                userRepository.countByRoleName(RoleName.SERVICE_PROVIDER),
                userRepository.countByRoleName(RoleName.CHILDRENS_HOME),
                userRepository.countByAccountLockedTrue(),
                ratingRepository.findPlatformAverageScore(),
                ratingRepository.countByIsActiveTrue()
        );
    }
}
