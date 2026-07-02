package com.helpinghands.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "childrens_homes",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_homes_registration_number", columnNames = "registration_number"),
                @UniqueConstraint(name = "uk_homes_user_id", columnNames = "user_id") // one profile per user
        },
        indexes = {
                @Index(name = "idx_homes_registration_number", columnList = "registration_number"),
                @Index(name = "idx_homes_name", columnList = "home_name"),
                @Index(name = "idx_homes_status", columnList = "verification_status")
        }
)
public class ChildrensHome extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "home_name", nullable = false, length = 200)
    private String homeName;

    @Column(name = "registration_number", nullable = false, length = 80)
    private String registrationNumber;

    @Column(name = "contact_number", nullable = false, length = 20)
    private String contactNumber;

    @Column(name = "contact_email", nullable = false, length = 150)
    private String contactEmail;

    @Column(name = "address", nullable = false, length = 500)
    private String address;

    @Column(name = "description", length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 20)
    private VerificationStatus verificationStatus = VerificationStatus.SUBMITTED;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Column(name = "reviewed_by", length = 150)
    private String reviewedBy;

    @Column(name = "reviewed_date")
    private LocalDateTime reviewedDate;

    /**
     * Only APPROVED homes may post donation/service requests — enforced in the
     * Requests module, not here, but this profile is the source of truth for that check.
     */
    public boolean isApproved() {
        return verificationStatus == VerificationStatus.APPROVED;
    }
}
