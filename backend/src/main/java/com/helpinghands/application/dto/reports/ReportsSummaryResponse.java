package com.helpinghands.application.dto.reports;

public record ReportsSummaryResponse(
        // Requests
        long totalGoodsRequests,
        long totalServiceRequests,
        long activeRequests,
        long completedRequests,
        long cancelledRequests,
        // Users
        long totalDonors,
        long totalServiceProviders,
        long totalChildrensHomes,
        long suspendedUsers,
        // Reputation
        Double platformAverageRating,
        long totalRatingsSubmitted
) {
}
