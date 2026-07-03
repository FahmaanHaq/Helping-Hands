package com.helpinghands.application.dto.request;

public record ImpactStatsResponse(
        long donors,
        long deliveryVolunteers,
        long verifiedHomes,
        long completedRequests
) {
}
