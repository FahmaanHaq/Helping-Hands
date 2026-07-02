package com.helpinghands.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Deliberately not extending BaseEntity — an audit trail must be append-only
 * and immutable; giving it soft-delete/modified columns would suggest entries
 * can be edited or hidden, which defeats the point of an audit log.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "audit_log", indexes = {
        @Index(name = "idx_audit_log_target", columnList = "target_type, target_id"),
        @Index(name = "idx_audit_log_date", columnList = "created_date")
})
public class AuditLogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    @Column(name = "performed_by", nullable = false, length = 150)
    private String performedBy;

    @Column(name = "target_type", length = 40)
    private String targetType;

    @Column(name = "target_id")
    private Long targetId;

    @Column(name = "details", length = 1000)
    private String details;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate = LocalDateTime.now();
}
