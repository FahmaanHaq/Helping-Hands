package com.helpinghands.application.service;

import com.helpinghands.infrastructure.repository.RatingRepository;
import com.helpinghands.infrastructure.repository.RequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RatingServiceTest {

    @Mock private RatingRepository ratingRepository;
    @Mock private RequestRepository requestRepository;
    @Mock private CurrentUserResolver currentUserResolver;

    private RatingService ratingService;

    private static final Long USER_ID = 42L;

    @BeforeEach
    void setUp() {
        ratingService = new RatingService(ratingRepository, requestRepository, currentUserResolver);
    }

    @Test
    void userWithFewRatings_isNotRestricted_evenIfAverageIsLow() {
        // Below MIN_RATINGS_FOR_RESTRICTION (3) — a single bad rating shouldn't restrict anyone.
        when(ratingRepository.findAverageScoreByRatedUserId(USER_ID)).thenReturn(1.0);
        when(ratingRepository.countByRatedUserIdAndIsActiveTrue(USER_ID)).thenReturn(2L);

        assertFalse(ratingService.isUserRestricted(USER_ID));
    }

    @Test
    void userWithEnoughRatings_andLowAverage_isRestricted() {
        when(ratingRepository.findAverageScoreByRatedUserId(USER_ID)).thenReturn(2.0);
        when(ratingRepository.countByRatedUserIdAndIsActiveTrue(USER_ID)).thenReturn(5L);

        assertTrue(ratingService.isUserRestricted(USER_ID));
    }

    @Test
    void userWithEnoughRatings_andGoodAverage_isNotRestricted() {
        when(ratingRepository.findAverageScoreByRatedUserId(USER_ID)).thenReturn(4.2);
        when(ratingRepository.countByRatedUserIdAndIsActiveTrue(USER_ID)).thenReturn(10L);

        assertFalse(ratingService.isUserRestricted(USER_ID));
    }

    @Test
    void userWithNoRatingsYet_isNotRestricted() {
        when(ratingRepository.findAverageScoreByRatedUserId(USER_ID)).thenReturn(null);
        when(ratingRepository.countByRatedUserIdAndIsActiveTrue(USER_ID)).thenReturn(0L);

        assertFalse(ratingService.isUserRestricted(USER_ID));
    }

    @Test
    void borderlineAverage_exactlyAtThreshold_isNotRestricted() {
        // MIN_AVERAGE_SCORE is 2.5 — the rule is "below" the threshold, not "at or below".
        when(ratingRepository.findAverageScoreByRatedUserId(USER_ID)).thenReturn(2.5);
        when(ratingRepository.countByRatedUserIdAndIsActiveTrue(USER_ID)).thenReturn(5L);

        assertFalse(ratingService.isUserRestricted(USER_ID));
    }
}
