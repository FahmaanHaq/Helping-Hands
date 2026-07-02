package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Placeholder for the Admin Oversight module. Demonstrates the two ways
 * role restriction is enforced in this codebase:
 *   1. Path-level, in SecurityConfig ("/api/v1/admin/**" -> hasRole ADMINISTRATOR)
 *   2. Method-level, via @PreAuthorize, for finer-grained checks within a controller.
 */
@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin", description = "Administrator-only oversight endpoints")
public class AdminController {

    @GetMapping("/ping")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ApiResponse<String> ping(Authentication authentication) {
        return ApiResponse.ok("Admin access confirmed", "Hello, " + authentication.getName());
    }
}
