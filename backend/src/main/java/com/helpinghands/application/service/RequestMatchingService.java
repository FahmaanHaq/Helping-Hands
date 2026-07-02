package com.helpinghands.application.service;

import com.helpinghands.application.dto.request.RequestResponse;
import com.helpinghands.domain.entity.*;
import com.helpinghands.infrastructure.repository.RequestRepository;
import com.helpinghands.infrastructure.repository.RequestSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Answers the SRS's "Auto-match items to requests" System use case. This is
 * a lightweight content-based recommender, not a full matching engine: it
 * looks at which categories the current user has pledged to before and
 * ranks currently-open requests in those categories higher, tie-broken by
 * urgency. A user with no pledge history yet just gets open requests sorted
 * by urgency — there's no "cold start" failure, only a less personalized result.
 */
@Service
@RequiredArgsConstructor
public class RequestMatchingService {

    private static final int MAX_RESULTS = 10;

    private final RequestRepository requestRepository;
    private final CurrentUserResolver currentUserResolver;
    private final RequestService requestService;

    @Transactional(readOnly = true)
    public List<RequestResponse> recommendedForCurrentUser() {
        User user = currentUserResolver.getCurrentUser();
        boolean isDonorLike = user.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.DONOR || r.getName() == RoleName.DELIVERY_VOLUNTEER);
        RequestType relevantType = isDonorLike ? RequestType.GOODS : RequestType.SERVICE;

        List<Request> pastPledges = requestRepository.findAll(
                Specification.where(RequestSpecifications.pledgedByUser(user.getId())));

        Set<GoodsCategory> preferredGoods = pastPledges.stream()
                .map(Request::getGoodsCategory).filter(java.util.Objects::nonNull).collect(Collectors.toSet());
        Set<ServiceCategory> preferredServices = pastPledges.stream()
                .map(Request::getServiceCategory).filter(java.util.Objects::nonNull).collect(Collectors.toSet());

        Specification<Request> openInType = Specification
                .where(RequestSpecifications.hasStatus(RequestStatus.CREATED))
                .and(RequestSpecifications.hasRequestType(relevantType))
                .and(RequestSpecifications.notFlagged());

        List<Request> openRequests = requestRepository.findAll(openInType, PageRequest.of(0, 100)).getContent();

        Comparator<Request> byUrgencyDesc = Comparator.comparingInt(
                (Request r) -> urgencyWeight(r.getUrgency())).reversed();

        return openRequests.stream()
                .sorted(Comparator
                        .comparing((Request r) -> matchesPreference(r, preferredGoods, preferredServices) ? 0 : 1)
                        .thenComparing(byUrgencyDesc))
                .limit(MAX_RESULTS)
                .map(requestService::toResponsePublic)
                .toList();
    }

    private boolean matchesPreference(Request r, Set<GoodsCategory> goods, Set<ServiceCategory> services) {
        return (r.getGoodsCategory() != null && goods.contains(r.getGoodsCategory()))
                || (r.getServiceCategory() != null && services.contains(r.getServiceCategory()));
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
