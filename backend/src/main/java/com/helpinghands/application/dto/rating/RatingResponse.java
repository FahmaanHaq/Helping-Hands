package com.helpinghands.application.dto.rating;

import java.time.LocalDateTime;

public record RatingResponse(
        Long id,
        Long requestId,
        String ratedUsername,
        Integer score,
        String comment,
        LocalDateTime createdDate
) {
}
