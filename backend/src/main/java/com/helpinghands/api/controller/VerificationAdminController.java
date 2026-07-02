package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.childrenshome.ChildrensHomeResponse;
import com.helpinghands.application.dto.serviceprovider.ServiceProviderResponse;
import com.helpinghands.application.dto.verification.VerificationDecisionRequest;
import com.helpinghands.application.service.ChildrensHomeService;
import com.helpinghands.application.service.ServiceProviderService;
import com.helpinghands.domain.entity.VerificationStatus;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Path is under /api/v1/admin/**, which SecurityConfig already restricts to
 * ROLE_ADMINISTRATOR at the filter-chain level; the @PreAuthorize annotations
 * here are a deliberate second layer of defense, not redundant with it.
 */
@RestController
@RequestMapping("/api/v1/admin/verification")
@RequiredArgsConstructor
@Tag(name = "Admin Verification", description = "Approve or reject Children's Home and Service Provider submissions")
public class VerificationAdminController {

    private final ChildrensHomeService childrensHomeService;
    private final ServiceProviderService serviceProviderService;

    @GetMapping("/childrens-homes")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ApiResponse<Page<ChildrensHomeResponse>> listChildrensHomes(
            @RequestParam(defaultValue = "SUBMITTED") VerificationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.ok("Retrieved", childrensHomeService.listByStatus(status, pageable));
    }

    @PatchMapping("/childrens-homes/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ApiResponse<ChildrensHomeResponse> decideChildrensHome(
            @PathVariable Long id, @Valid @RequestBody VerificationDecisionRequest decision) {
        return ApiResponse.ok("Decision recorded", childrensHomeService.decide(id, decision));
    }

    @GetMapping("/service-providers")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ApiResponse<Page<ServiceProviderResponse>> listServiceProviders(
            @RequestParam(defaultValue = "SUBMITTED") VerificationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.ok("Retrieved", serviceProviderService.listByStatus(status, pageable));
    }

    @PatchMapping("/service-providers/{id}")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ApiResponse<ServiceProviderResponse> decideServiceProvider(
            @PathVariable Long id, @Valid @RequestBody VerificationDecisionRequest decision) {
        return ApiResponse.ok("Decision recorded", serviceProviderService.decide(id, decision));
    }
}
