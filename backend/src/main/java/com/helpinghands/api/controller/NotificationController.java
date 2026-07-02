package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.notification.NotificationResponse;
import com.helpinghands.application.service.NotificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notifications for the logged-in user")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<Page<NotificationResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ApiResponse.ok("Retrieved", notificationService.list(PageRequest.of(page, size)));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Long> unreadCount() {
        return ApiResponse.ok("Retrieved", notificationService.unreadCount());
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        return ApiResponse.ok("Marked read", null);
    }

    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllRead() {
        notificationService.markAllRead();
        return ApiResponse.ok("All marked read", null);
    }
}
