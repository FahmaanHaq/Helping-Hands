package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.message.RequestMessageResponse;
import com.helpinghands.application.dto.message.SendMessageRequest;
import com.helpinghands.application.service.RequestMessageService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/requests/{requestId}/messages")
@RequiredArgsConstructor
@Tag(name = "Request Messages", description = "Chat between a Children's Home and whoever pledged, once accepted")
public class RequestMessageController {

    private final RequestMessageService requestMessageService;

    @GetMapping
    public ApiResponse<List<RequestMessageResponse>> list(@PathVariable Long requestId) {
        return ApiResponse.ok("Retrieved", requestMessageService.list(requestId));
    }

    @PostMapping
    public ApiResponse<RequestMessageResponse> send(
            @PathVariable Long requestId, @Valid @RequestBody SendMessageRequest request) {
        return ApiResponse.ok("Message sent", requestMessageService.send(requestId, request.content()));
    }
}
