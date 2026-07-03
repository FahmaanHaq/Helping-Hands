package com.helpinghands.application.service;

import com.helpinghands.api.exception.ApiException;
import com.helpinghands.application.dto.message.RequestMessageResponse;
import com.helpinghands.domain.entity.NotificationType;
import com.helpinghands.domain.entity.Request;
import com.helpinghands.domain.entity.RequestMessage;
import com.helpinghands.domain.entity.RequestStatus;
import com.helpinghands.domain.entity.User;
import com.helpinghands.infrastructure.repository.RequestMessageRepository;
import com.helpinghands.infrastructure.repository.RequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * A request-scoped chat between exactly two people: the owning Children's
 * Home and whoever pledged to fulfil it. Deliberately request-scoped rather
 * than a general inbox — the conversation only makes sense in the context
 * of that specific donation/service, and access is revoked the moment
 * there's no pledge to talk about.
 *
 * Only opens once a pledge has actually been accepted — a Home shouldn't be
 * fielding messages from every Donor who merely expressed interest before
 * committing, and a Donor shouldn't be messaging a Home about a request no
 * one has agreed to yet.
 */
@Service
@RequiredArgsConstructor
public class RequestMessageService {

    private final RequestMessageRepository requestMessageRepository;
    private final RequestRepository requestRepository;
    private final CurrentUserResolver currentUserResolver;
    private final NotificationService notificationService;

    @Transactional
    public RequestMessageResponse send(Long requestId, String content) {
        Request request = findAndAssertParticipant(requestId);
        User sender = currentUserResolver.getCurrentVerifiedUser();

        RequestMessage message = new RequestMessage();
        message.setRequest(request);
        message.setSender(sender);
        message.setContent(content);
        RequestMessage saved = requestMessageRepository.save(message);

        User homeUser = request.getChildrensHome().getUser();
        User pledgedUser = request.getPledgedBy();
        boolean senderIsHome = sender.getId().equals(homeUser.getId());
        boolean senderIsPledgedUser = pledgedUser != null && sender.getId().equals(pledgedUser.getId());

        String notificationText = sender.getUsername() + " sent a message about \"" + request.getTitle() + "\".";
        String link = "/requests/" + requestId;

        if (senderIsHome && pledgedUser != null) {
            notificationService.notify(pledgedUser, NotificationType.MESSAGE_RECEIVED, "New Message", notificationText, link);
        } else if (senderIsPledgedUser) {
            notificationService.notify(homeUser, NotificationType.MESSAGE_RECEIVED, "New Message", notificationText, link);
        } else {
            // Sender is neither party — an Administrator intervening in the
            // conversation. Notify both sides rather than defaulting to one,
            // since there's no "other party" to infer from the sender here.
            notificationService.notify(homeUser, NotificationType.MESSAGE_RECEIVED, "New Message", notificationText, link);
            if (pledgedUser != null) {
                notificationService.notify(pledgedUser, NotificationType.MESSAGE_RECEIVED, "New Message", notificationText, link);
            }
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RequestMessageResponse> list(Long requestId) {
        findAndAssertParticipant(requestId);
        return requestMessageRepository.findByRequestIdAndIsActiveTrueOrderByCreatedDateAsc(requestId)
                .stream().map(this::toResponse).toList();
    }

    /**
     * Both the ownership check and the "has this actually been accepted
     * yet" check live here, in one place, so both send() and list() can
     * never drift out of sync on who's allowed to see a conversation.
     */
    private Request findAndAssertParticipant(Long requestId) {
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException("Request not found", HttpStatus.NOT_FOUND));

        if (request.getStatus() == RequestStatus.CREATED || request.getStatus() == RequestStatus.PLEDGED) {
            throw new ApiException("Messaging opens once a pledge has been accepted", HttpStatus.CONFLICT);
        }

        User currentUser = currentUserResolver.getCurrentUser();
        boolean isHome = request.getChildrensHome().getUser().getId().equals(currentUser.getId());
        boolean isPledgedUser = request.getPledgedBy() != null
                && request.getPledgedBy().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName() == com.helpinghands.domain.entity.RoleName.ADMINISTRATOR);

        if (!isHome && !isPledgedUser && !isAdmin) {
            throw new ApiException("You do not have access to this conversation", HttpStatus.FORBIDDEN);
        }

        return request;
    }

    private RequestMessageResponse toResponse(RequestMessage m) {
        return new RequestMessageResponse(m.getId(), m.getSender().getId(), m.getSender().getUsername(),
                m.getContent(), m.getCreatedDate());
    }
}
