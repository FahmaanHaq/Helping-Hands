package com.helpinghands.application.service;

import com.helpinghands.api.exception.ApiException;
import com.helpinghands.application.dto.childrenshome.ChildrensHomeRegistrationRequest;
import com.helpinghands.application.dto.childrenshome.ChildrensHomeResponse;
import com.helpinghands.application.dto.verification.VerificationDecisionRequest;
import com.helpinghands.domain.entity.ChildrensHome;
import com.helpinghands.domain.entity.User;
import com.helpinghands.domain.entity.VerificationStatus;
import com.helpinghands.infrastructure.repository.ChildrensHomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ChildrensHomeService {

    private final ChildrensHomeRepository childrensHomeRepository;
    private final CurrentUserResolver currentUserResolver;
    private final AuditLogService auditLogService;

    @Transactional
    public ChildrensHomeResponse register(ChildrensHomeRegistrationRequest request) {
        User user = currentUserResolver.getCurrentUser();

        if (childrensHomeRepository.existsByUserId(user.getId())) {
            throw new ApiException("A Children's Home profile already exists for this account", HttpStatus.CONFLICT);
        }
        if (childrensHomeRepository.existsByRegistrationNumber(request.registrationNumber())) {
            throw new ApiException("This registration number is already in use", HttpStatus.CONFLICT);
        }

        ChildrensHome home = new ChildrensHome();
        home.setUser(user);
        home.setHomeName(request.homeName());
        home.setRegistrationNumber(request.registrationNumber());
        home.setContactNumber(request.contactNumber());
        home.setContactEmail(request.contactEmail());
        home.setAddress(request.address());
        home.setDescription(request.description());
        home.setVerificationStatus(VerificationStatus.SUBMITTED);

        return toResponse(childrensHomeRepository.save(home));
    }

    @Transactional(readOnly = true)
    public ChildrensHomeResponse getMyProfile() {
        User user = currentUserResolver.getCurrentUser();
        ChildrensHome home = childrensHomeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException("No Children's Home profile found for this account", HttpStatus.NOT_FOUND));
        return toResponse(home);
    }

    @Transactional(readOnly = true)
    public Page<ChildrensHomeResponse> listByStatus(VerificationStatus status, Pageable pageable) {
        return childrensHomeRepository.findByVerificationStatus(status, pageable).map(this::toResponse);
    }

    @Transactional
    public ChildrensHomeResponse decide(Long homeId, VerificationDecisionRequest decision) {
        if (decision.decision() != VerificationStatus.APPROVED && decision.decision() != VerificationStatus.REJECTED) {
            throw new ApiException("Decision must be APPROVED or REJECTED", HttpStatus.BAD_REQUEST);
        }
        if (decision.decision() == VerificationStatus.REJECTED
                && (decision.rejectionReason() == null || decision.rejectionReason().isBlank())) {
            throw new ApiException("A rejection reason is required when rejecting", HttpStatus.BAD_REQUEST);
        }

        ChildrensHome home = childrensHomeRepository.findById(homeId)
                .orElseThrow(() -> new ApiException("Children's Home profile not found", HttpStatus.NOT_FOUND));

        home.setVerificationStatus(decision.decision());
        home.setRejectionReason(decision.decision() == VerificationStatus.REJECTED ? decision.rejectionReason() : null);
        home.setReviewedBy(SecurityContextHolder.getContext().getAuthentication().getName());
        home.setReviewedDate(LocalDateTime.now());

        ChildrensHome saved = childrensHomeRepository.save(home);
        auditLogService.record(
                "VERIFICATION_" + decision.decision(), "CHILDRENS_HOME", home.getId(),
                decision.decision() == VerificationStatus.REJECTED ? decision.rejectionReason() : null);

        return toResponse(saved);
    }

    private ChildrensHomeResponse toResponse(ChildrensHome home) {
        return new ChildrensHomeResponse(
                home.getId(),
                home.getHomeName(),
                home.getRegistrationNumber(),
                home.getContactNumber(),
                home.getContactEmail(),
                home.getAddress(),
                home.getDescription(),
                home.getVerificationStatus(),
                home.getRejectionReason(),
                home.getReviewedBy(),
                home.getReviewedDate(),
                home.getCreatedDate()
        );
    }
}
