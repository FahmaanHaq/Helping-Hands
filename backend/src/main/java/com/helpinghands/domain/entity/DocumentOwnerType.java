package com.helpinghands.domain.entity;

/**
 * Polymorphic owner reference for documents — avoids a separate join table
 * per owner type. (owner_type, owner_id) together identify the record.
 */
public enum DocumentOwnerType {
    CHILDRENS_HOME,
    SERVICE_PROVIDER
}
