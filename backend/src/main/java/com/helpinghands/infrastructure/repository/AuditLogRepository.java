package com.helpinghands.infrastructure.repository;

import com.helpinghands.domain.entity.AuditLogEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLogEntry, Long> {
    Page<AuditLogEntry> findAllByOrderByCreatedDateDesc(Pageable pageable);
}
