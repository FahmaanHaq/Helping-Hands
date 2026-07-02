package com.helpinghands.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Not extending BaseEntity — tokens are transient, single-use artifacts,
 * not domain records that need audit/soft-delete semantics. They're deleted
 * outright once expired (see TokenService cleanup) rather than soft-deleted.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "verification_tokens", indexes = {
        @Index(name = "idx_tokens_hash", columnList = "token_hash"),
        @Index(name = "idx_tokens_user", columnList = "user_id")
})
public class VerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * SHA-256 hash of the raw token — the raw value only ever exists in the
     * email link itself, never persisted, so a database leak alone can't be
     * used to verify emails or reset passwords (same principle as password hashing).
     */
    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "token_type", nullable = false, length = 30)
    private TokenType tokenType;

    @Column(name = "expiry_date", nullable = false)
    private LocalDateTime expiryDate;

    @Column(name = "used", nullable = false)
    private Boolean used = false;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate = LocalDateTime.now();

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryDate);
    }
}
