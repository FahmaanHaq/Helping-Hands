package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.AuthResponse;
import com.helpinghands.application.dto.ForgotPasswordRequest;
import com.helpinghands.application.dto.LoginRequest;
import com.helpinghands.application.dto.RegisterRequest;
import com.helpinghands.application.dto.ResetPasswordRequest;
import com.helpinghands.application.dto.VerifyMfaRequest;
import com.helpinghands.application.service.AuthService;
import com.helpinghands.application.service.CurrentUserResolver;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Registration, login, token issuance, email verification and password reset")
public class AuthController {

    private final AuthService authService;
    private final CurrentUserResolver currentUserResolver;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Registration successful. Check your email to verify your account.", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        String message = Boolean.TRUE.equals(response.mfaRequired())
                ? "A login code has been sent to your email"
                : "Login successful";
        return ResponseEntity.ok(ApiResponse.ok(message, response));
    }

    @PostMapping("/verify-mfa")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyMfa(@Valid @RequestBody VerifyMfaRequest request) {
        AuthResponse response = authService.verifyMfa(request.userId(), request.code());
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response));
    }

    @GetMapping("/verify-email")
    public ApiResponse<Void> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ApiResponse.ok("Email verified successfully", null);
    }

    @PostMapping("/resend-verification")
    public ApiResponse<Void> resendVerification() {
        authService.resendVerificationEmail(currentUserResolver.getCurrentUser().getId());
        return ApiResponse.ok("Verification email sent", null);
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        // Same response whether or not the email exists — see AuthService.forgotPassword.
        return ApiResponse.ok("If an account exists for that email, a reset link has been sent.", null);
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.newPassword());
        return ApiResponse.ok("Password reset successfully. You can now log in.", null);
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
