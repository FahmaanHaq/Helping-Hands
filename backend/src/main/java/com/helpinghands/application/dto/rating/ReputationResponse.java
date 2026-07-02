package com.helpinghands.application.dto.rating;

public record ReputationResponse(
        Long userId,
        Double averageScore, // null if no ratings yet
        Long totalRatings,
        Boolean restricted // true if reputation is low enough to block new pledges
) {
}
