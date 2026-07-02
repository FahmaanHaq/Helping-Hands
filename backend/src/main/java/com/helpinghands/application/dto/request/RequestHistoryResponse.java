package com.helpinghands.application.dto.request;

import com.helpinghands.domain.entity.RequestStatus;

import java.time.LocalDateTime;

public record RequestHistoryResponse(
        RequestStatus fromStatus,
        RequestStatus toStatus,
        String changedBy,
        LocalDateTime changedDate,
        String remarks
) {
}
