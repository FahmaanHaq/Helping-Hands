package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.request.FlagRequestRequest;
import com.helpinghands.application.dto.request.RequestResponse;
import com.helpinghands.application.service.DocumentService;
import com.helpinghands.application.service.RequestService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/moderation")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRATOR')")
@Tag(name = "Content Moderation", description = "Flag inappropriate requests and remove individual documents without cancelling the whole request")
public class ContentModerationController {

    private final RequestService requestService;
    private final DocumentService documentService;

    /**
     * Flags or clears a flag on a request. Deliberately separate from the
     * lifecycle status endpoint (PATCH /requests/{id}/status) — moderation
     * and fulfilment lifecycle are independent concerns. A flagged request
     * keeps whatever status it was in; it's just hidden from marketplace
     * browse until cleared.
     */
    @PatchMapping("/requests/{id}/flag")
    public ApiResponse<RequestResponse> flagRequest(@PathVariable Long id, @Valid @RequestBody FlagRequestRequest request) {
        RequestResponse response = requestService.setFlagged(id, request.flagged(), request.reason());
        return ApiResponse.ok(request.flagged() ? "Request flagged" : "Flag cleared", response);
    }

    /**
     * Removes a single document (e.g. an inappropriate request image) via
     * soft delete, without touching the request/profile it belongs to.
     */
    @DeleteMapping("/documents/{id}")
    public ApiResponse<Void> removeDocument(@PathVariable Long id) {
        documentService.remove(id);
        return ApiResponse.ok("Document removed", null);
    }
}
