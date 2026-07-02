package com.helpinghands.application.dto.request;

import com.helpinghands.domain.entity.GoodsCategory;
import com.helpinghands.domain.entity.RequestType;
import com.helpinghands.domain.entity.ServiceCategory;
import com.helpinghands.domain.entity.UrgencyLevel;

public record PublicFeaturedRequestResponse(
        Long id,
        String title,
        String childrensHomeName,
        RequestType requestType,
        GoodsCategory goodsCategory,
        ServiceCategory serviceCategory,
        Integer quantity,
        UrgencyLevel urgency
) {
}
