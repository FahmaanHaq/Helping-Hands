package com.helpinghands.application.service;

import com.helpinghands.api.exception.ApiException;
import com.helpinghands.application.dto.admin.SuspendUserRequest;
import com.helpinghands.application.dto.admin.UserSummaryResponse;
import com.helpinghands.domain.entity.RoleName;
import com.helpinghands.domain.entity.User;
import com.helpinghands.infrastructure.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final CurrentUserResolver currentUserResolver;

    @Transactional(readOnly = true)
    public Page<UserSummaryResponse> list(String search, Pageable pageable) {
        Page<User> page = (search == null || search.isBlank())
                ? userRepository.findAll(pageable)
                : userRepository.search(search, pageable);
        return page.map(this::toResponse);
    }

    @Transactional
    public UserSummaryResponse suspend(Long userId, SuspendUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        if (user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ADMINISTRATOR)) {
            throw new ApiException("Administrator accounts cannot be suspended through this endpoint", HttpStatus.FORBIDDEN);
        }
        if (user.getId().equals(currentUserResolver.getCurrentUser().getId())) {
            throw new ApiException("You cannot suspend your own account", HttpStatus.BAD_REQUEST);
        }

        user.setAccountLocked(true);
        user.setSuspensionReason(request.reason());
        user.setSuspendedBy(currentUserResolver.getCurrentUser().getUsername());
        user.setSuspendedDate(LocalDateTime.now());

        User saved = userRepository.save(user);
        auditLogService.record("USER_SUSPENDED", "USER", saved.getId(), request.reason());

        return toResponse(saved);
    }

    @Transactional
    public UserSummaryResponse reinstate(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.NOT_FOUND));

        user.setAccountLocked(false);
        user.setSuspensionReason(null);
        user.setSuspendedBy(null);
        user.setSuspendedDate(null);

        User saved = userRepository.save(user);
        auditLogService.record("USER_REINSTATED", "USER", saved.getId(), null);

        return toResponse(saved);
    }

    private UserSummaryResponse toResponse(User user) {
        return new UserSummaryResponse(
                user.getId(),
                user.getFullName(),
                user.getUsername(),
                user.getEmail(),
                user.getRoles().stream().map(r -> r.getName().name()).toList(),
                user.getAccountLocked(),
                user.getSuspensionReason(),
                user.getCreatedDate()
        );
    }
}
