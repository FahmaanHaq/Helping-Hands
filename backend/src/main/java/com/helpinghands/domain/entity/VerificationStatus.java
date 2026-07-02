package com.helpinghands.domain.entity;

/**
 * Shared verification lifecycle: Submitted -> Under Review -> Approved / Rejected.
 * Used by both ChildrensHome and ServiceProvider profiles.
 */
public enum VerificationStatus {
    SUBMITTED,
    UNDER_REVIEW,
    APPROVED,
    REJECTED
}
