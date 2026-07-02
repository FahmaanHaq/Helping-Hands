package com.helpinghands.domain.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Not extending BaseEntity — same rationale as AuditLogEntry: an append-only
 * security log shouldn't have soft-delete/modified semantics suggesting it
 * can be edited.
 */
@Entity
@Table(name = "failed_login_attempts", indexes = {
        @Index(name = "idx_failed_login_identifier", columnList = "identifier, attempted_at")
})
public class FailedLoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The username/email that was attempted — logged even if it doesn't match a real account. */
    @Column(name = "identifier", nullable = false, length = 150)
    private String identifier;

    @Column(name = "attempted_at", nullable = false)
    private LocalDateTime attemptedAt = LocalDateTime.now();

    public Long getId() { return id; }
    public String getIdentifier() { return identifier; }
    public void setIdentifier(String identifier) { this.identifier = identifier; }
    public LocalDateTime getAttemptedAt() { return attemptedAt; }
    public void setAttemptedAt(LocalDateTime attemptedAt) { this.attemptedAt = attemptedAt; }
}
