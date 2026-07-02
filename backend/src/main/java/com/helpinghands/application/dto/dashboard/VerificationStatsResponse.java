package com.helpinghands.application.dto.dashboard;

public record VerificationStatsResponse(
        long homesSubmitted,
        long homesUnderReview,
        long homesApproved,
        long homesRejected,
        long providersSubmitted,
        long providersUnderReview,
        long providersApproved,
        long providersRejected
) {
}
