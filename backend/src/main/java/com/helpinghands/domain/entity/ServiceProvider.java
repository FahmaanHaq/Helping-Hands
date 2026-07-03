package com.helpinghands.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "service_providers",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_providers_user_id", columnNames = "user_id") // one profile per user
        },
        indexes = {
                @Index(name = "idx_providers_status", columnList = "verification_status")
        }
)
public class ServiceProvider extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "skills", nullable = false, length = 500)
    private String skills;

    @Column(name = "qualifications", length = 2000)
    private String qualifications;

    @ElementCollection(targetClass = ServiceCategory.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "service_provider_categories", joinColumns = @JoinColumn(name = "provider_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private Set<ServiceCategory> serviceCategories = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "service_mode", nullable = false, length = 20)
    private ServiceMode serviceMode;

    /**
     * Derived from serviceMode at registration time (see ServiceProviderService).
     * Kept as a persisted column rather than computed-on-read so the verification
     * workflow can be audited later even if business rules change.
     */
    @Column(name = "police_clearance_required", nullable = false)
    private Boolean policeClearanceRequired;

    /**
     * Set by an admin once the uploaded police clearance document has been checked.
     * Wired up properly once the Document Upload module exists; until then this is
     * toggled manually alongside the verification decision.
     */
    @Column(name = "police_clearance_verified", nullable = false)
    private Boolean policeClearanceVerified = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false, length = 20)
    private VerificationStatus verificationStatus = VerificationStatus.SUBMITTED;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    /**
     * Counts resubmissions after a rejection — NOT the initial submission.
     * See ChildrensHome.resubmissionCount for the same rationale.
     */
    @Column(name = "resubmission_count", nullable = false)
    private Integer resubmissionCount = 0;

    @Column(name = "reviewed_by", length = 150)
    private String reviewedBy;

    @Column(name = "reviewed_date")
    private LocalDateTime reviewedDate;

    public boolean isApproved() {
        return verificationStatus == VerificationStatus.APPROVED;
    }

    /**
     * A provider is fully clear to offer services only when approved AND
     * (police clearance isn't required OR it has been verified).
     */
    public boolean isEligibleToOfferServices() {
        return isApproved() && (!policeClearanceRequired || policeClearanceVerified);
    }
}
