package com.helpinghands.application.dto.request;

import com.helpinghands.domain.entity.GoodsCategory;
import com.helpinghands.domain.entity.RequestType;
import com.helpinghands.domain.entity.ServiceCategory;
import com.helpinghands.domain.entity.UrgencyLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateRequestRequest(
        @NotNull RequestType requestType,
        GoodsCategory goodsCategory,       // required if requestType == GOODS
        ServiceCategory serviceCategory,   // required if requestType == SERVICE
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @Positive Integer quantity,         // only meaningful for GOODS
        @NotNull UrgencyLevel urgency
) {
}
