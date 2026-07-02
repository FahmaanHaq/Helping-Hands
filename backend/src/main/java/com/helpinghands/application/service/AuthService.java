package com.helpinghands.application.service;

import com.helpinghands.api.exception.ApiException;
import com.helpinghands.application.dto.AuthResponse;
import com.helpinghands.application.dto.LoginRequest;
import com.helpinghands.application.dto.RegisterRequest;
import com.helpinghands.domain.entity.Role;
import com.helpinghands.domain.entity.RoleName;
import com.helpinghands.domain.entity.User;
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

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AuditLogService auditLogService;

    @Value("${security.admin-bootstrap-secret}")
    private String adminBootstrapSecret;

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

        List<String> roleNames = List.of("ROLE_" + role.getName().name());
        String token = jwtService.generateToken(new UserPrincipal(saved));

        return new AuthResponse(token, saved.getId(), saved.getUsername(), roleNames);
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

        User saved = userRepository.save(user);
        auditLogService.record("ADMIN_PROVISIONED", "USER", saved.getId(), "New Administrator account: " + saved.getUsername());

        String token = jwtService.generateToken(new UserPrincipal(saved));
        return new AuthResponse(token, saved.getId(), saved.getUsername(), List.of("ROLE_ADMINISTRATOR"));
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

        return new AuthResponse(token, user.getId(), user.getUsername(), roleNames);
    }
}
