package com.helpinghands.application.service;

import com.helpinghands.domain.entity.AuditLogEntry;
import com.helpinghands.infrastructure.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Resolves "who did this" from the security context directly rather than
     * via CurrentUserResolver, because a couple of callers (e.g. admin
     * bootstrap, the very first admin account being created) have no
     * authenticated principal yet — "system" is a legitimate actor here,
     * not an error.
     */
    @Transactional
    public void record(String actionType, String targetType, Long targetId, String details) {
        AuditLogEntry entry = new AuditLogEntry();
        entry.setActionType(actionType);
        entry.setPerformedBy(resolveActor());
        entry.setTargetType(targetType);
        entry.setTargetId(targetId);
        entry.setDetails(details);
        auditLogRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogEntry> list(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedDateDesc(pageable);
    }

    private String resolveActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return "system";
        }
        return authentication.getName();
    }
}
