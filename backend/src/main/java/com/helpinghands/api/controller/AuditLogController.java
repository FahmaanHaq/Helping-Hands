package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.service.AuditLogService;
import com.helpinghands.domain.entity.AuditLogEntry;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/audit-log")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRATOR')")
@Tag(name = "Admin Audit Log", description = "Read-only view of significant platform actions")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ApiResponse<Page<AuditLogEntry>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ApiResponse.ok("Retrieved", auditLogService.list(PageRequest.of(page, size)));
    }
}
