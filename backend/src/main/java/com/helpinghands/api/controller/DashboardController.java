package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.dashboard.VerificationStatsResponse;
import com.helpinghands.application.service.DashboardStatsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@Tag(name = "Admin Dashboard", description = "Aggregate stats for the admin dashboard")
public class DashboardController {

    private final DashboardStatsService dashboardStatsService;

    @GetMapping("/verification-stats")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ApiResponse<VerificationStatsResponse> getVerificationStats() {
        return ApiResponse.ok("Retrieved", dashboardStatsService.getVerificationStats());
    }
}
