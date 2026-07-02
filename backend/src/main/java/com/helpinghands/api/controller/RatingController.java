package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.rating.RatingResponse;
import com.helpinghands.application.dto.rating.ReputationResponse;
import com.helpinghands.application.dto.rating.SubmitRatingRequest;
import com.helpinghands.application.service.RatingService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "Reputation & Feedback", description = "Ratings on completed requests and reputation lookups")
public class RatingController {

    private final RatingService ratingService;

    @PostMapping("/api/v1/requests/{id}/rating")
    @PreAuthorize("hasRole('CHILDRENS_HOME')")
    public ResponseEntity<ApiResponse<RatingResponse>> submit(
            @PathVariable Long id, @Valid @RequestBody SubmitRatingRequest request) {
        RatingResponse response = ratingService.submit(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Rating submitted", response));
    }

    @GetMapping("/api/v1/requests/{id}/rating")
    public ApiResponse<RatingResponse> getForRequest(@PathVariable Long id) {
        return ApiResponse.ok("Retrieved", ratingService.getForRequest(id));
    }

    @GetMapping("/api/v1/users/{userId}/reputation")
    public ApiResponse<ReputationResponse> getReputation(@PathVariable Long userId) {
        return ApiResponse.ok("Retrieved", ratingService.getReputation(userId));
    }
}
