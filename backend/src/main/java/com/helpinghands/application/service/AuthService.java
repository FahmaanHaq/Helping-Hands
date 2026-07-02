package com.helpinghands.application.service;

import com.helpinghands.api.exception.ApiException;
import com.helpinghands.application.dto.AuthResponse;
import com.helpinghands.application.dto.LoginRequest;
import com.helpinghands.application.dto.RegisterRequest;
import com.helpinghands.domain.entity.Role;
import com.helpinghands.domain.entity.RoleName;
import com.helpinghands.domain.entity.TokenType;
import com.helpinghands.domain.entity.User;
import com.helpinghands.infrastructure.email.EmailService;
import com.helpinghands.infrastructure.repository.RoleRepository;
import com.helpinghands.infrastructure.repository.UserRepository;
import com.helpinghands.infrastructure.security.JwtService;
import com.helpinghands.infrastructure.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final long EMAIL_VERIFICATION_VALIDITY_MINUTES = 24 * 60;
    private static final long PASSWORD_RESET_VALIDITY_MINUTES = 60;
    private static final java.time.Duration RESEND_COOLDOWN = java.time.Duration.ofMinutes(2);
    private static final java.time.Duration FORGOT_PASSWORD_COOLDOWN = java.time.Duration.ofMinutes(2);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;
    private final TokenService tokenService;
    private final EmailService emailService;
    private final RateLimiterService rateLimiterService;

    @Value("${security.admin-bootstrap-secret}")
    private String adminBootstrapSecret;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException("An account with this email already exists", HttpStatus.CONFLICT);
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new ApiException("This username is already taken", HttpStatus.CONFLICT);
        }

        Role role = roleRepository.findByName(request.role())
                .orElseThrow(() -> new ApiException("Requested role is not configured", HttpStatus.BAD_REQUEST));

        User user = new User();
        user.setFullName(request.fullName());
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPhoneNumber(request.phoneNumber());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRoles(Set.of(role));
        // Verification-dependent roles (ChildrensHome, ServiceProvider) stay functionally
        // restricted until their respective verification workflow entities are approved;
        // that check lives in those modules, not here.

        User saved = userRepository.save(user);
        sendVerificationEmail(saved);

        List<String> roleNames = List.of("ROLE_" + role.getName().name());
        String token = jwtService.generateToken(new UserPrincipal(saved));

        return new AuthResponse(token, saved.getId(), saved.getUsername(), roleNames, saved.getEmailVerified());
    }

    @Transactional
    public AuthResponse registerAdmin(RegisterRequest request, String providedSecret) {
        if (adminBootstrapSecret == null || adminBootstrapSecret.isBlank()
                || !adminBootstrapSecret.equals(providedSecret)) {
            // Same message either way — don't reveal whether the secret was wrong
            // vs. not configured, that's an implementation detail an attacker
            // shouldn't get for free.
            throw new ApiException("Invalid bootstrap token", HttpStatus.FORBIDDEN);
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException("An account with this email already exists", HttpStatus.CONFLICT);
        }
        if (userRepository.existsByUsername(request.username())) {
            throw new ApiException("This username is already taken", HttpStatus.CONFLICT);
        }

        Role adminRole = roleRepository.findByName(RoleName.ADMINISTRATOR)
                .orElseThrow(() -> new ApiException("ADMINISTRATOR role is not configured", HttpStatus.INTERNAL_SERVER_ERROR));

        User user = new User();
        user.setFullName(request.fullName());
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setPhoneNumber(request.phoneNumber());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRoles(Set.of(adminRole));
        user.setEmailVerified(true); // administrators are provisioned, not self-registered — skip the email hoop

        User saved = userRepository.save(user);
        auditLogService.record("ADMIN_PROVISIONED", "USER", saved.getId(), "New Administrator account: " + saved.getUsername());

        String token = jwtService.generateToken(new UserPrincipal(saved));
        return new AuthResponse(token, saved.getId(), saved.getUsername(), List.of("ROLE_ADMINISTRATOR"), true);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.usernameOrEmail(), request.password()));

        User user = userRepository.findActiveByUsernameOrEmail(request.usernameOrEmail())
                .orElseThrow(() -> new ApiException("Invalid username/email or password", HttpStatus.UNAUTHORIZED));

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);

        List<String> roleNames = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return new AuthResponse(token, user.getId(), user.getUsername(), roleNames, user.getEmailVerified());
    }

    @Transactional
    public void resendVerificationEmail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new ApiException("This email is already verified", HttpStatus.CONFLICT);
        }
        if (!rateLimiterService.tryAcquire("resend-verification:" + userId, RESEND_COOLDOWN)) {
            throw new ApiException(
                    "Please wait a couple of minutes before requesting another verification email",
                    HttpStatus.TOO_MANY_REQUESTS);
        }
        sendVerificationEmail(user);
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        User user = tokenService.consumeToken(rawToken, TokenType.EMAIL_VERIFICATION)
                .orElseThrow(() -> new ApiException("This verification link is invalid or has expired", HttpStatus.BAD_REQUEST));

        user.setEmailVerified(true);
        userRepository.save(user);
    }

    /**
     * Deliberately returns void and never reveals whether the email exists —
     * responding identically either way prevents using this endpoint to
     * enumerate registered accounts.
     */
    @Transactional
    public void forgotPassword(String email) {
        // Rate-limited on the raw email string itself, before the lookup — this
        // way the cooldown check doesn't leak whether the email is registered
        // (an attacker probing for account existence via response timing/behavior
        // gets identical treatment either way).
        if (!rateLimiterService.tryAcquire("forgot-password:" + email.toLowerCase(), FORGOT_PASSWORD_COOLDOWN)) {
            return; // silently no-op; response to the caller is identical either way (see controller)
        }

        userRepository.findByEmailAndIsActiveTrue(email).ifPresent(user -> {
            String rawToken = tokenService.issueToken(user, TokenType.PASSWORD_RESET, PASSWORD_RESET_VALIDITY_MINUTES);
            String resetLink = frontendUrl + "/reset-password?token=" + rawToken;
            emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), resetLink);
        });
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        User user = tokenService.consumeToken(rawToken, TokenType.PASSWORD_RESET)
                .orElseThrow(() -> new ApiException("This reset link is invalid or has expired", HttpStatus.BAD_REQUEST));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        auditLogService.record("PASSWORD_RESET", "USER", user.getId(), null);
    }

    private void sendVerificationEmail(User user) {
        String rawToken = tokenService.issueToken(user, TokenType.EMAIL_VERIFICATION, EMAIL_VERIFICATION_VALIDITY_MINUTES);
        String verificationLink = frontendUrl + "/verify-email?token=" + rawToken;
        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), verificationLink);
    }
}
