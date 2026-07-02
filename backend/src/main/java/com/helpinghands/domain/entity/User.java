package com.helpinghands.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_users_email", columnNames = "email"),
                @UniqueConstraint(name = "uk_users_username", columnNames = "username")
        },
        indexes = {
                @Index(name = "idx_users_email", columnList = "email"),
                @Index(name = "idx_users_name", columnList = "full_name")
        }
)
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "username", nullable = false, length = 60)
    private String username;

    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified = false;

    /**
     * Account lock used by admin moderation (suspend / ban) rather than a hard delete.
     */
    @Column(name = "account_locked", nullable = false)
    private Boolean accountLocked = false;

    @Column(name = "suspension_reason", length = 500)
    private String suspensionReason;

    @Column(name = "suspended_by", length = 150)
    private String suspendedBy;

    @Column(name = "suspended_date")
    private java.time.LocalDateTime suspendedDate;

    /**
     * Used by the scheduled inactivity sweep (see UserMaintenanceService) to
     * identify accounts that haven't logged in for a long time. Null means
     * "never logged in since this column was added" — treated as active
     * until the next real login, not immediately flagged.
     */
    @Column(name = "last_login_date")
    private java.time.LocalDateTime lastLoginDate;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();
}
