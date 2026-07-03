package com.helpinghands.application.service;

import com.helpinghands.api.exception.ApiException;
import com.helpinghands.application.dto.rating.RatingResponse;
import com.helpinghands.application.dto.rating.ReputationResponse;
import com.helpinghands.application.dto.rating.SubmitRatingRequest;
import com.helpinghands.domain.entity.Rating;
import com.helpinghands.domain.entity.NotificationType;
import com.helpinghands.domain.entity.Request;
import com.helpinghands.domain.entity.RequestStatus;
import com.helpinghands.domain.entity.User;
import com.helpinghands.infrastructure.repository.RatingRepository;
import com.helpinghands.infrastructure.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RatingService {

    /**
     * A user needs at least this many ratings before reputation is considered
     * meaningful — one bad rating shouldn't restrict someone permanently.
     */
    public static final long MIN_RATINGS_FOR_RESTRICTION = 3;
    public static final double MIN_AVERAGE_SCORE = 2.5;

    private final RatingRepository ratingRepository;
    private final RequestRepository requestRepository;
    private final CurrentUserResolver currentUserResolver;
    private final NotificationService notificationService;

    @Transactional
    public RatingResponse submit(Long requestId, SubmitRatingRequest req) {
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException("Request not found", HttpStatus.NOT_FOUND));

        User currentUser = currentUserResolver.getCurrentVerifiedUser();
        if (!request.getChildrensHome().getUser().getId().equals(currentUser.getId())) {
            throw new ApiException("Only the requesting home can rate this request", HttpStatus.FORBIDDEN);
        }
        if (request.getStatus() != RequestStatus.COMPLETED) {
            throw new ApiException("A request can only be rated after it is marked COMPLETED", HttpStatus.CONFLICT);
        }
        if (request.getPledgedBy() == null) {
            throw new ApiException("This request has no fulfiller to rate", HttpStatus.CONFLICT);
        }
        if (ratingRepository.existsByRequestId(requestId)) {
            throw new ApiException("This request has already been rated", HttpStatus.CONFLICT);
        }

        Rating rating = new Rating();
        rating.setRequest(request);
        rating.setRatedUser(request.getPledgedBy());
        rating.setScore(req.score());
        rating.setComment(req.comment());

        Rating saved = ratingRepository.save(rating);

        notificationService.notify(request.getPledgedBy(), NotificationType.RATING_RECEIVED,
                "New Rating Received", "You received a " + req.score() + "-star rating for \"" + request.getTitle() + "\".",
                "/requests/" + request.getId());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public RatingResponse getForRequest(Long requestId) {
        Rating rating = ratingRepository.findByRequestId(requestId)
                .orElseThrow(() -> new ApiException("No rating found for this request", HttpStatus.NOT_FOUND));
        return toResponse(rating);
    }

    @Transactional(readOnly = true)
    public ReputationResponse getReputation(Long userId) {
        Double average = ratingRepository.findAverageScoreByRatedUserId(userId);
        long total = ratingRepository.countByRatedUserIdAndIsActiveTrue(userId);
        boolean restricted = isRestricted(average, total);
        return new ReputationResponse(userId, average, total, restricted);
    }

    /**
     * Used by RequestService to enforce the "low reputation users may be
     * restricted" rule at the point someone tries to pledge to a new request.
     */
    @Transactional(readOnly = true)
    public boolean isUserRestricted(Long userId) {
        Double average = ratingRepository.findAverageScoreByRatedUserId(userId);
        long total = ratingRepository.countByRatedUserIdAndIsActiveTrue(userId);
        return isRestricted(average, total);
    }

    private boolean isRestricted(Double average, long total) {
        return total >= MIN_RATINGS_FOR_RESTRICTION && average != null && average < MIN_AVERAGE_SCORE;
    }

    private RatingResponse toResponse(Rating r) {
        return new RatingResponse(
                r.getId(),
                r.getRequest().getId(),
                r.getRatedUser().getUsername(),
                r.getScore(),
                r.getComment(),
                r.getCreatedDate()
        );
    }
}
