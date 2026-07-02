package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.admin.SuspendUserRequest;
import com.helpinghands.application.dto.admin.UserSummaryResponse;
import com.helpinghands.application.service.UserAdminService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRATOR')")
@Tag(name = "Admin User Management", description = "List, suspend, and reinstate user accounts")
public class UserAdminController {

    private final UserAdminService userAdminService;

    @GetMapping
    public ApiResponse<Page<UserSummaryResponse>> list(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Retrieved", userAdminService.list(search, PageRequest.of(page, size)));
    }

    @PatchMapping("/{id}/suspend")
    public ApiResponse<UserSummaryResponse> suspend(@PathVariable Long id, @Valid @RequestBody SuspendUserRequest request) {
        return ApiResponse.ok("User suspended", userAdminService.suspend(id, request));
    }

    @PatchMapping("/{id}/reinstate")
    public ApiResponse<UserSummaryResponse> reinstate(@PathVariable Long id) {
        return ApiResponse.ok("User reinstated", userAdminService.reinstate(id));
    }
}
