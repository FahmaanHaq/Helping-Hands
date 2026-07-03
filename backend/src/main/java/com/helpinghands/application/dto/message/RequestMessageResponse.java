package com.helpinghands.application.dto.message;

import java.time.LocalDateTime;

public record RequestMessageResponse(
        Long id,
        Long senderId,
        String senderUsername,
        String content,
        LocalDateTime createdDate
) {
}
