package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.request.*;
import com.helpinghands.application.service.RequestService;
import com.helpinghands.domain.entity.RequestStatus;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/requests")
@RequiredArgsConstructor
@Tag(name = "Requests", description = "Donation and service request lifecycle")
public class RequestController {

    private final RequestService requestService;

    @PostMapping
    @PreAuthorize("hasRole('CHILDRENS_HOME')")
    public ResponseEntity<ApiResponse<RequestResponse>> create(@Valid @RequestBody CreateRequestRequest request) {
        RequestResponse response = requestService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Request created", response));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('CHILDRENS_HOME')")
    public ApiResponse<RequestResponse> update(@PathVariable Long id, @Valid @RequestBody UpdateRequestRequest request) {
        return ApiResponse.ok("Request updated", requestService.update(id, request));
    }

    @GetMapping("/{id}")
    public ApiResponse<RequestResponse> get(@PathVariable Long id) {
        return ApiResponse.ok("Retrieved", requestService.get(id));
    }

    /**
     * Marketplace browse — defaults to CREATED (open, unpledged requests).
     * Any authenticated role can browse; write actions are still gated by
     * assertAuthorizedForTransition in the service.
     */
    @GetMapping
    public ApiResponse<Page<RequestResponse>> browse(
            @RequestParam(required = false) RequestStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.ok("Retrieved", requestService.browse(status, pageable));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CHILDRENS_HOME')")
    public ApiResponse<Page<RequestResponse>> myRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Retrieved", requestService.myRequests(PageRequest.of(page, size)));
    }

    @GetMapping("/my-pledges")
    @PreAuthorize("hasRole('DONOR') or hasRole('SERVICE_PROVIDER')")
    public ApiResponse<Page<RequestResponse>> myPledges(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Retrieved", requestService.myPledges(PageRequest.of(page, size)));
    }

    @GetMapping("/{id}/history")
    public ApiResponse<List<RequestHistoryResponse>> history(@PathVariable Long id) {
        return ApiResponse.ok("Retrieved", requestService.history(id));
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<RequestResponse> changeStatus(
            @PathVariable Long id, @Valid @RequestBody RequestStatusChangeRequest request) {
        return ApiResponse.ok("Status updated", requestService.changeStatus(id, request));
    }
}
