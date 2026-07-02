package com.helpinghands.application.dto.directory;

public record DirectoryUserResponse(
        Long id,
        String fullName,
        String username,
        Double averageRating,
        Long totalRatings
) {
}
