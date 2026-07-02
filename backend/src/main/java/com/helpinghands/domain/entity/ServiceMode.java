package com.helpinghands.domain.entity;

/**
 * ONSITE = provider will be physically present with children -> police clearance mandatory.
 * ONLINE_ONLY = remote-only service (e.g. online tutoring) -> police clearance may be bypassed.
 */
public enum ServiceMode {
    ONSITE,
    ONLINE_ONLY
}
