package com.helpinghands.application.dto.request;

import com.helpinghands.domain.entity.*;

import java.time.LocalDateTime;

public record RequestResponse(
        Long id,
        Long childrensHomeId,
        String childrensHomeName,
        RequestType requestType,
        GoodsCategory goodsCategory,
        ServiceCategory serviceCategory,
        String title,
        String description,
        Integer quantity,
        UrgencyLevel urgency,
        RequestStatus status,
        Long pledgedByUserId,
        String pledgedByUsername,
        String cancellationReason,
        Boolean flagged,
        String flagReason,
        LocalDateTime createdDate
) {
}
