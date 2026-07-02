package com.helpinghands.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Append-only audit trail of every status transition a Request goes through.
 * Deliberately not extending BaseEntity — history rows are immutable facts,
 * they're never soft-deleted or modified, so the Modified* columns don't apply.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "request_status_history", indexes = {
        @Index(name = "idx_request_history_request", columnList = "request_id")
})
public class RequestStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private Request request;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", length = 20)
    private RequestStatus fromStatus; // null for the initial CREATED entry

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 20)
    private RequestStatus toStatus;

    @Column(name = "changed_by", nullable = false, length = 150)
    private String changedBy;

    @Column(name = "changed_date", nullable = false)
    private java.time.LocalDateTime changedDate = java.time.LocalDateTime.now();

    @Column(name = "remarks", length = 500)
    private String remarks;
}
