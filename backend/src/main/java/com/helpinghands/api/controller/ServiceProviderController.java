package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.serviceprovider.ServiceProviderRegistrationRequest;
import com.helpinghands.application.dto.serviceprovider.ServiceProviderResponse;
import com.helpinghands.application.service.ServiceProviderService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/service-providers")
@RequiredArgsConstructor
@Tag(name = "Service Providers", description = "Registration and profile lookup for Service Provider accounts")
public class ServiceProviderController {

    private final ServiceProviderService serviceProviderService;

    @PostMapping("/me")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    public ResponseEntity<ApiResponse<ServiceProviderResponse>> register(
            @Valid @RequestBody ServiceProviderRegistrationRequest request) {
        ServiceProviderResponse response = serviceProviderService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Registration submitted for review", response));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('SERVICE_PROVIDER')")
    public ResponseEntity<ApiResponse<ServiceProviderResponse>> getMyProfile() {
        return ResponseEntity.ok(ApiResponse.ok("Profile retrieved", serviceProviderService.getMyProfile()));
    }
}
