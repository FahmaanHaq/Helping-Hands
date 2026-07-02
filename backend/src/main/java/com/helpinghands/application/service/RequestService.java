package com.helpinghands.application.service;

import com.helpinghands.api.exception.ApiException;
import com.helpinghands.application.dto.request.*;
import com.helpinghands.domain.entity.*;
import com.helpinghands.infrastructure.repository.ChildrensHomeRepository;
import com.helpinghands.infrastructure.repository.RequestRepository;
import com.helpinghands.infrastructure.repository.RequestSpecifications;
import com.helpinghands.infrastructure.repository.RequestStatusHistoryRepository;
import com.helpinghands.infrastructure.repository.ServiceProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RequestService {

    private final RequestRepository requestRepository;
    private final RequestStatusHistoryRepository historyRepository;
    private final ChildrensHomeRepository childrensHomeRepository;
    private final ServiceProviderRepository serviceProviderRepository;
    private final CurrentUserResolver currentUserResolver;
    private final RatingService ratingService;
    private final AuditLogService auditLogService;

    @Transactional
    public RequestResponse create(CreateRequestRequest req) {
        User user = currentUserResolver.getCurrentUser();
        ChildrensHome home = childrensHomeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException("No Children's Home profile found for this account", HttpStatus.NOT_FOUND));

        if (!home.isApproved()) {
            throw new ApiException(
                    "Your Children's Home must be approved before you can post requests",
                    HttpStatus.FORBIDDEN);
        }

        if (req.requestType() == RequestType.GOODS && req.goodsCategory() == null) {
            throw new ApiException("goodsCategory is required for GOODS requests", HttpStatus.BAD_REQUEST);
        }
        if (req.requestType() == RequestType.SERVICE && req.serviceCategory() == null) {
            throw new ApiException("serviceCategory is required for SERVICE requests", HttpStatus.BAD_REQUEST);
        }

        Request request = new Request();
        request.setChildrensHome(home);
        request.setRequestType(req.requestType());
        request.setGoodsCategory(req.requestType() == RequestType.GOODS ? req.goodsCategory() : null);
        request.setServiceCategory(req.requestType() == RequestType.SERVICE ? req.serviceCategory() : null);
        request.setTitle(req.title());
        request.setDescription(req.description());
        request.setQuantity(req.requestType() == RequestType.GOODS ? req.quantity() : null);
        request.setUrgency(req.urgency());
        request.setStatus(RequestStatus.CREATED);

        Request saved = requestRepository.save(request);
        recordHistory(saved, null, RequestStatus.CREATED, "Request created");

        return toResponse(saved);
    }

    @Transactional
    public RequestResponse update(Long id, UpdateRequestRequest req) {
        Request request = getOwnedRequestOrThrow(id);

        if (request.getStatus() != RequestStatus.CREATED) {
            throw new ApiException("Only requests still in CREATED status can be edited", HttpStatus.CONFLICT);
        }

        request.setTitle(req.title());
        request.setDescription(req.description());
        if (request.isGoods()) {
            request.setQuantity(req.quantity());
        }
        if (req.urgency() != null) {
            request.setUrgency(req.urgency());
        }

        return toResponse(requestRepository.save(request));
    }

    @Transactional(readOnly = true)
    public RequestResponse get(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public Page<RequestResponse> browse(RequestStatus status, RequestType requestType, GoodsCategory goodsCategory,
                                         ServiceCategory serviceCategory, UrgencyLevel urgency, Boolean flaggedOnly,
                                         Pageable pageable) {
        boolean isAdmin = isAdmin(currentUserResolver.getCurrentUser());

        // Normally defaults to CREATED (the marketplace view). Exception: an admin
        // explicitly asking for "flagged only" wants to see flagged items across
        // every status — that's the whole point of a moderation queue — so status
        // stays unfiltered unless they also pick one.
        RequestStatus effective = status;
        if (effective == null && !(isAdmin && Boolean.TRUE.equals(flaggedOnly))) {
            effective = RequestStatus.CREATED;
        }

        Specification<Request> spec = Specification.where(RequestSpecifications.hasStatus(effective))
                .and(RequestSpecifications.hasRequestType(requestType))
                .and(RequestSpecifications.hasGoodsCategory(goodsCategory))
                .and(RequestSpecifications.hasServiceCategory(serviceCategory))
                .and(RequestSpecifications.hasUrgency(urgency));

        if (isAdmin && Boolean.TRUE.equals(flaggedOnly)) {
            spec = spec.and(RequestSpecifications.isFlagged());
        } else if (!isAdmin) {
            // Flagged content is hidden from everyone except Administrators, who are
            // the ones doing the moderating — they need to see it to act on it.
            spec = spec.and(RequestSpecifications.notFlagged());
        }

        return requestRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<RequestResponse> myRequests(Pageable pageable) {
        User user = currentUserResolver.getCurrentUser();
        ChildrensHome home = childrensHomeRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ApiException("No Children's Home profile found for this account", HttpStatus.NOT_FOUND));
        return requestRepository.findByChildrensHomeId(home.getId(), pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<RequestResponse> myPledges(Pageable pageable) {
        User user = currentUserResolver.getCurrentUser();
        return requestRepository.findByPledgedById(user.getId(), pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<RequestHistoryResponse> history(Long id) {
        findOrThrow(id); // 404 if the request itself doesn't exist
        return historyRepository.findByRequestIdOrderByChangedDateAsc(id).stream()
                .map(h -> new RequestHistoryResponse(h.getFromStatus(), h.getToStatus(), h.getChangedBy(), h.getChangedDate(), h.getRemarks()))
                .toList();
    }

    /**
     * The single state-transition entry point. Rather than one endpoint per
     * transition, every status change flows through here so the legal-transition
     * table and the role rules live in exactly one place.
     */
    @Transactional
    public RequestResponse changeStatus(Long id, RequestStatusChangeRequest change) {
        Request request = findOrThrow(id);
        User user = currentUserResolver.getCurrentUser();
        RequestStatus from = request.getStatus();
        RequestStatus to = change.status();

        assertLegalTransition(from, to, isAdmin(user));
        assertAuthorizedForTransition(request, user, from, to);

        if (to == RequestStatus.PLEDGED) {
            if (ratingService.isUserRestricted(user.getId())) {
                throw new ApiException(
                        "Your reputation score is too low to pledge to new requests. Contact an administrator.",
                        HttpStatus.FORBIDDEN);
            }
            request.setPledgedBy(user);
        }
        if (to == RequestStatus.CANCELLED) {
            request.setCancellationReason(change.remarks());
        }

        request.setStatus(to);
        Request saved = requestRepository.save(request);
        recordHistory(saved, from, to, change.remarks());

        return toResponse(saved);
    }

    /**
     * Content moderation — hides a request from the public marketplace without
     * touching its lifecycle status, so a Home mid-fulfilment isn't forced into
     * CANCELLED just because its description needs review. Admin-only, enforced
     * at the controller (@PreAuthorize) and path level (SecurityConfig).
     */
    @Transactional
    public RequestResponse setFlagged(Long id, boolean flagged, String reason) {
        Request request = findOrThrow(id);
        User admin = currentUserResolver.getCurrentUser();

        request.setFlagged(flagged);
        request.setFlagReason(flagged ? reason : null);
        request.setFlaggedBy(flagged ? admin.getUsername() : null);
        request.setFlaggedDate(flagged ? java.time.LocalDateTime.now() : null);

        Request saved = requestRepository.save(request);
        auditLogService.record(flagged ? "REQUEST_FLAGGED" : "REQUEST_UNFLAGGED", "REQUEST", id, reason);

        return toResponse(saved);
    }

    // ---- Transition rules ----

    private static final Set<RequestStatus> CANCELLABLE_FROM = Set.of(RequestStatus.CREATED, RequestStatus.PLEDGED);

    private void assertLegalTransition(RequestStatus from, RequestStatus to, boolean isAdmin) {
        if (isAdmin && to == RequestStatus.CANCELLED
                && from != RequestStatus.COMPLETED && from != RequestStatus.CANCELLED) {
            return; // admin dispute-resolution override: cancel from any non-terminal status
        }

        boolean legal = switch (from) {
            case CREATED -> to == RequestStatus.PLEDGED || to == RequestStatus.CANCELLED;
            case PLEDGED -> to == RequestStatus.ACCEPTED || to == RequestStatus.CANCELLED;
            case ACCEPTED -> to == RequestStatus.IN_PROGRESS;
            case IN_PROGRESS -> to == RequestStatus.DELIVERED;
            case DELIVERED -> to == RequestStatus.COMPLETED;
            case COMPLETED, CANCELLED -> false; // terminal states
        };
        if (!legal) {
            throw new ApiException(
                    "Cannot move a request from " + from + " to " + to,
                    HttpStatus.CONFLICT);
        }
    }

    private boolean isAdmin(User user) {
        return user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ADMINISTRATOR);
    }

    private void assertAuthorizedForTransition(Request request, User user, RequestStatus from, RequestStatus to) {
        boolean isAdmin = user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.ADMINISTRATOR);
        if (isAdmin) return; // admins can override any transition (moderation/dispute resolution)

        boolean isOwningHome = request.getChildrensHome().getUser().getId().equals(user.getId());
        boolean isPledgedUser = request.getPledgedBy() != null && request.getPledgedBy().getId().equals(user.getId());

        boolean authorized = switch (to) {
            case PLEDGED -> {
                // Must NOT be the owning home, and role must match the request type.
                if (isOwningHome) yield false;
                if (request.isGoods()) {
                    yield user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.DONOR);
                }
                // SERVICE requests: role alone isn't enough — the provider profile
                // itself must be APPROVED and, if police clearance is required,
                // verified. Unverified providers must never be able to pledge.
                boolean isServiceProvider = user.getRoles().stream().anyMatch(r -> r.getName() == RoleName.SERVICE_PROVIDER);
                if (!isServiceProvider) yield false;
                yield serviceProviderRepository.findByUserId(user.getId())
                        .map(ServiceProvider::isEligibleToOfferServices)
                        .orElse(false);
            }
            case ACCEPTED -> isOwningHome;
            case IN_PROGRESS -> isPledgedUser || isOwningHome;
            case DELIVERED -> isPledgedUser;
            case COMPLETED -> isOwningHome; // home confirms completion, per spec
            case CANCELLED -> isOwningHome && CANCELLABLE_FROM.contains(from);
            default -> false;
        };

        if (!authorized) {
            throw new ApiException("You are not permitted to make this status change", HttpStatus.FORBIDDEN);
        }
    }

    // ---- Helpers ----

    private Request findOrThrow(Long id) {
        return requestRepository.findById(id)
                .orElseThrow(() -> new ApiException("Request not found", HttpStatus.NOT_FOUND));
    }

    private Request getOwnedRequestOrThrow(Long id) {
        Request request = findOrThrow(id);
        User user = currentUserResolver.getCurrentUser();
        if (!request.getChildrensHome().getUser().getId().equals(user.getId())) {
            throw new ApiException("You do not own this request", HttpStatus.FORBIDDEN);
        }
        return request;
    }

    private void recordHistory(Request request, RequestStatus from, RequestStatus to, String remarks) {
        RequestStatusHistory history = new RequestStatusHistory();
        history.setRequest(request);
        history.setFromStatus(from);
        history.setToStatus(to);
        history.setChangedBy(currentUserResolver.getCurrentUser().getUsername());
        history.setRemarks(remarks);
        historyRepository.save(history);
    }

    private RequestResponse toResponse(Request r) {
        return new RequestResponse(
                r.getId(),
                r.getChildrensHome().getId(),
                r.getChildrensHome().getHomeName(),
                r.getRequestType(),
                r.getGoodsCategory(),
                r.getServiceCategory(),
                r.getTitle(),
                r.getDescription(),
                r.getQuantity(),
                r.getUrgency(),
                r.getStatus(),
                r.getPledgedBy() != null ? r.getPledgedBy().getId() : null,
                r.getPledgedBy() != null ? r.getPledgedBy().getUsername() : null,
                r.getCancellationReason(),
                r.getFlagged(),
                r.getFlagReason(),
                r.getCreatedDate()
        );
    }
}
