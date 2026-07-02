package com.helpinghands.application.dto.notification;

import com.helpinghands.domain.entity.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String title,
        String message,
        String link,
        Boolean read,
        LocalDateTime createdDate
) {
}
