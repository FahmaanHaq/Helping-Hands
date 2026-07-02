package com.helpinghands.application.service;

import com.helpinghands.api.exception.ApiException;
import com.helpinghands.application.dto.notification.NotificationResponse;
import com.helpinghands.domain.entity.Notification;
import com.helpinghands.domain.entity.NotificationType;
import com.helpinghands.domain.entity.User;
import com.helpinghands.infrastructure.email.EmailService;
import com.helpinghands.infrastructure.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmailService emailService;
    private final CurrentUserResolver currentUserResolver;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /**
     * The single place every other service calls to notify a user of
     * something. Always creates the in-app record; also always sends the
     * corresponding email (async, per SmtpEmailService — never blocks the
     * caller). A per-user notification-preferences system (e.g. "don't email
     * me for every pledge") is a reasonable next step but out of scope here —
     * every event notifies via both channels today.
     */
    @Transactional
    public void notify(User recipient, NotificationType type, String title, String message, String link) {
        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setLink(link);
        notificationRepository.save(notification);

        String actionLink = link != null ? frontendUrl + link : null;
        emailService.sendNotificationEmail(recipient.getEmail(), recipient.getFullName(), title, message, actionLink);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> list(Pageable pageable) {
        Long userId = currentUserResolver.getCurrentUser().getId();
        return notificationRepository.findByRecipientIdOrderByCreatedDateDesc(userId, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public long unreadCount() {
        Long userId = currentUserResolver.getCurrentUser().getId();
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    @Transactional
    public void markRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException("Notification not found", HttpStatus.NOT_FOUND));

        Long userId = currentUserResolver.getCurrentUser().getId();
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new ApiException("You do not have access to this notification", HttpStatus.FORBIDDEN);
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllRead() {
        Long userId = currentUserResolver.getCurrentUser().getId();
        notificationRepository.markAllReadForRecipient(userId);
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getType(), n.getTitle(), n.getMessage(), n.getLink(), n.getRead(), n.getCreatedDate());
    }
}
