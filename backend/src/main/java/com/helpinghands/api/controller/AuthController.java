package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.AuthResponse;
import com.helpinghands.application.dto.LoginRequest;
import com.helpinghands.application.dto.RegisterRequest;
import com.helpinghands.application.service.AuthService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Registration, login and token issuance")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    /**
     * Provisions an Administrator account. Deliberately NOT wired into the normal
     * /register flow or the RoleName options a user can self-select — replaces the
     * "register normally, then promote via a manual SQL UPDATE" workaround with a
     * proper, auditable path: only callable by someone who has the bootstrap secret
     * (set via ADMIN_BOOTSTRAP_SECRET), which lives in your deployment's env vars,
     * not in application code or any public-facing form.
     */
    @PostMapping("/register-admin")
    public ResponseEntity<ApiResponse<AuthResponse>> registerAdmin(
            @Valid @RequestBody RegisterRequest request,
            @RequestHeader("X-Admin-Bootstrap-Token") String bootstrapToken) {
        AuthResponse response = authService.registerAdmin(request, bootstrapToken);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Administrator account created", response));
    }
}
