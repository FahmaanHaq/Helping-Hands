package com.helpinghands.application.service;

import com.helpinghands.api.exception.ApiException;
import com.helpinghands.application.dto.serviceprovider.ServiceProviderRegistrationRequest;
import com.helpinghands.application.dto.serviceprovider.ServiceProviderResponse;
import com.helpinghands.application.dto.verification.VerificationDecisionRequest;
import com.helpinghands.domain.entity.NotificationType;
import com.helpinghands.domain.entity.ServiceMode;
import com.helpinghands.domain.entity.ServiceProvider;
import com.helpinghands.domain.entity.User;
import com.helpinghands.domain.entity.VerificationStatus;
import com.helpinghands.infrastructure.repository.ServiceProviderRepository;
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
public class ServiceProviderService {

    private final ServiceProviderRepository serviceProviderRepository;
    private final CurrentUserResolver currentUserResolver;
    private final AuditLogService auditLogService;
    private final NotificationService notificationService;

    @Transactional
    public ServiceProviderResponse register(ServiceProviderRegistrationRequest request) {
        User user = currentUserResolver.getCurrentUser();

        if (serviceProviderRepository.existsByUserId(user.getId())) {
            throw new ApiException("A Service Provider profile already exists for this account", HttpStatus.CONFLICT);
        }

        ServiceProvider provider = new ServiceProvider();
        provider.setUser(user);
        provider.setSkills(request.skills());
        provider.setQualifications(request.qualifications());
        provider.setServiceCategories(request.serviceCategories());
        provider.setServiceMode(request.serviceMode());

        // Business rule: onsite (direct child interaction) mandates police clearance;
        // online-only services may bypass it.
        provider.setPoliceClearanceRequired(request.serviceMode() == ServiceMode.ONSITE);
        provider.setVerificationStatus(VerificationStatus.SUBMITTED);

        return toResponse(serviceProviderRepository.save(provider));
    }

    @Transactional(readOnly = true)
    public ServiceProviderResponse getMyProfile() {
        User user = currentUserResolver.getCurrentUser();
        ServiceProvider provider = serviceProviderRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException("No Service Provider profile found for this account", HttpStatus.NOT_FOUND));
        return toResponse(provider);
    }

    @Transactional(readOnly = true)
    public Page<ServiceProviderResponse> listByStatus(VerificationStatus status, Pageable pageable) {
        return serviceProviderRepository.findByVerificationStatus(status, pageable).map(this::toResponse);
    }

    @Transactional
    public ServiceProviderResponse decide(Long providerId, VerificationDecisionRequest decision) {
        if (decision.decision() != VerificationStatus.APPROVED && decision.decision() != VerificationStatus.REJECTED) {
            throw new ApiException("Decision must be APPROVED or REJECTED", HttpStatus.BAD_REQUEST);
        }

        ServiceProvider provider = serviceProviderRepository.findById(providerId)
                .orElseThrow(() -> new ApiException("Service Provider profile not found", HttpStatus.NOT_FOUND));

        if (decision.decision() == VerificationStatus.REJECTED
                && (decision.rejectionReason() == null || decision.rejectionReason().isBlank())) {
            throw new ApiException("A rejection reason is required when rejecting", HttpStatus.BAD_REQUEST);
        }

        // Guard rail matching the spec's hard rule: cannot approve an onsite provider
        // whose police clearance hasn't been verified.
        boolean clearanceOk = !provider.getPoliceClearanceRequired()
                || Boolean.TRUE.equals(decision.policeClearanceVerified())
                || provider.getPoliceClearanceVerified();

        if (decision.decision() == VerificationStatus.APPROVED
                && provider.getPoliceClearanceRequired()
                && !clearanceOk) {
            throw new ApiException(
                    "Cannot approve: police clearance is mandatory for onsite providers and has not been verified",
                    HttpStatus.BAD_REQUEST);
        }

        if (decision.policeClearanceVerified() != null) {
            provider.setPoliceClearanceVerified(decision.policeClearanceVerified());
        }

        provider.setVerificationStatus(decision.decision());
        provider.setRejectionReason(decision.decision() == VerificationStatus.REJECTED ? decision.rejectionReason() : null);
        provider.setReviewedBy(SecurityContextHolder.getContext().getAuthentication().getName());
        provider.setReviewedDate(LocalDateTime.now());

        ServiceProvider saved = serviceProviderRepository.save(provider);
        auditLogService.record(
                "VERIFICATION_" + decision.decision(), "SERVICE_PROVIDER", provider.getId(),
                decision.decision() == VerificationStatus.REJECTED ? decision.rejectionReason() : null);

        NotificationType notificationType = decision.decision() == VerificationStatus.APPROVED
                ? NotificationType.VERIFICATION_APPROVED : NotificationType.VERIFICATION_REJECTED;
        String message = decision.decision() == VerificationStatus.APPROVED
                ? "Your Service Provider profile has been approved. You can now pledge to requests."
                : "Your Service Provider registration was rejected: " + decision.rejectionReason();
        notificationService.notify(provider.getUser(), notificationType, "Verification Decision", message, "/service-provider");

        return toResponse(saved);
    }

    private ServiceProviderResponse toResponse(ServiceProvider provider) {
        return new ServiceProviderResponse(
                provider.getId(),
                provider.getSkills(),
                provider.getQualifications(),
                provider.getServiceCategories(),
                provider.getServiceMode(),
                provider.getPoliceClearanceRequired(),
                provider.getPoliceClearanceVerified(),
                provider.getVerificationStatus(),
                provider.getRejectionReason(),
                provider.getReviewedBy(),
                provider.getReviewedDate(),
                provider.getCreatedDate()
        );
    }
}
