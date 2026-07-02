package com.helpinghands.domain.entity;

/**
 * Only meaningful for GOODS requests. Set by the pledged user when moving
 * a request to IN_PROGRESS or DELIVERED — matches the SRS class diagram's
 * Donation.deliveryMethod / courierDetails fields.
 */
public enum DeliveryMethod {
    SELF_DELIVERY,
    VOLUNTEER_PICKUP,
    COURIER
}
