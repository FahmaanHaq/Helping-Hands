package com.helpinghands.domain.entity;

/**
 * Lifecycle: CREATED -> PLEDGED -> ACCEPTED -> IN_PROGRESS -> DELIVERED -> COMPLETED.
 * CANCELLED is a side-exit reachable from CREATED or PLEDGED only (see RequestService
 * for the full transition table).
 */
public enum RequestStatus {
    CREATED,
    PLEDGED,
    ACCEPTED,
    IN_PROGRESS,
    DELIVERED,
    COMPLETED,
    CANCELLED
}
