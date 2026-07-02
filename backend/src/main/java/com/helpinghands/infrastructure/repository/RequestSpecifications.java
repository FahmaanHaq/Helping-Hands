package com.helpinghands.infrastructure.repository;

import com.helpinghands.domain.entity.*;
import org.springframework.data.jpa.domain.Specification;

public final class RequestSpecifications {

    private RequestSpecifications() {}

    public static Specification<Request> hasStatus(RequestStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    public static Specification<Request> hasRequestType(RequestType type) {
        return (root, query, cb) -> type == null ? null : cb.equal(root.get("requestType"), type);
    }

    public static Specification<Request> hasGoodsCategory(GoodsCategory category) {
        return (root, query, cb) -> category == null ? null : cb.equal(root.get("goodsCategory"), category);
    }

    public static Specification<Request> hasServiceCategory(ServiceCategory category) {
        return (root, query, cb) -> category == null ? null : cb.equal(root.get("serviceCategory"), category);
    }

    public static Specification<Request> hasUrgency(UrgencyLevel urgency) {
        return (root, query, cb) -> urgency == null ? null : cb.equal(root.get("urgency"), urgency);
    }

    public static Specification<Request> belongsToHome(Long childrensHomeId) {
        return (root, query, cb) -> childrensHomeId == null ? null : cb.equal(root.get("childrensHome").get("id"), childrensHomeId);
    }

    public static Specification<Request> pledgedByUser(Long userId) {
        return (root, query, cb) -> userId == null ? null : cb.equal(root.get("pledgedBy").get("id"), userId);
    }

    /**
     * Excludes flagged content from the public marketplace. Admins bypass this
     * entirely (see RequestService.browse) — they need to see flagged items
     * precisely because that's what they're moderating.
     */
    public static Specification<Request> notFlagged() {
        return (root, query, cb) -> cb.isFalse(root.get("flagged"));
    }

    public static Specification<Request> isFlagged() {
        return (root, query, cb) -> cb.isTrue(root.get("flagged"));
    }
}
