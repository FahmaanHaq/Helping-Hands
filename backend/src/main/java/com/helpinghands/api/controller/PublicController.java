package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.request.ImpactStatsResponse;
import com.helpinghands.application.dto.request.PublicFeaturedRequestResponse;
import com.helpinghands.domain.entity.Request;
import com.helpinghands.domain.entity.RequestStatus;
import com.helpinghands.domain.entity.RoleName;
import com.helpinghands.domain.entity.UrgencyLevel;
import com.helpinghands.domain.entity.VerificationStatus;
import com.helpinghands.infrastructure.repository.ChildrensHomeRepository;
import com.helpinghands.infrastructure.repository.RequestRepository;
import com.helpinghands.infrastructure.repository.RequestSpecifications;
import com.helpinghands.infrastructure.repository.UserRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

/**
 * The only endpoints in the whole API that are genuinely public (no JWT,
 * see SecurityConfig's permitAll for this path). Deliberately exposes the
 * absolute minimum: request title/category/urgency/home name, and
 * aggregate counts only (never anything identifying) — never contact
 * details, documents, or anything a bad actor could scrape for something
 * other than "is this platform active and worth signing up for."
 */
@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@Tag(name = "Public", description = "Unauthenticated homepage content")
public class PublicController {

    private final RequestRepository requestRepository;
    private final UserRepository userRepository;
    private final ChildrensHomeRepository childrensHomeRepository;

    @GetMapping("/featured-requests")
    public ApiResponse<List<PublicFeaturedRequestResponse>> featuredRequests() {
        Specification<Request> openNotFlagged = Specification
                .where(RequestSpecifications.hasStatus(RequestStatus.CREATED))
                .and(RequestSpecifications.notFlagged());

        List<Request> requests = requestRepository.findAll(openNotFlagged, PageRequest.of(0, 50)).getContent();

        List<PublicFeaturedRequestResponse> featured = requests.stream()
                .sorted(Comparator.comparingInt((Request r) -> urgencyWeight(r.getUrgency())).reversed())
                .limit(6)
                .map(r -> new PublicFeaturedRequestResponse(
                        r.getId(), r.getTitle(), r.getChildrensHome().getHomeName(),
                        r.getRequestType(), r.getGoodsCategory(), r.getServiceCategory(),
                        r.getQuantity(), r.getUrgency()))
                .toList();

        return ApiResponse.ok("Retrieved", featured);
    }

    /**
     * Real aggregate counts for the homepage's impact section — never
     * fabricated, never identifying (just totals). The frontend rounds
     * these down to tidy display thresholds (e.g. 5+, 100+) rather than
     * showing raw numbers, but the underlying counts here are exact and
     * always current.
     */
    @GetMapping("/impact-stats")
    public ApiResponse<ImpactStatsResponse> impactStats() {
        long donors = userRepository.countByRoleName(RoleName.DONOR);
        long deliveryVolunteers = userRepository.countByRoleName(RoleName.DELIVERY_VOLUNTEER);
        long verifiedHomes = childrensHomeRepository.countByVerificationStatus(VerificationStatus.APPROVED);
        long completedRequests = requestRepository.countByStatus(RequestStatus.COMPLETED);

        return ApiResponse.ok("Retrieved", new ImpactStatsResponse(donors, deliveryVolunteers, verifiedHomes, completedRequests));
    }

    private int urgencyWeight(UrgencyLevel urgency) {
        return switch (urgency) {
            case CRITICAL -> 4;
            case HIGH -> 3;
            case MEDIUM -> 2;
            case LOW -> 1;
        };
    }
}
