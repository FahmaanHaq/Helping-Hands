package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.directory.DirectoryUserResponse;
import com.helpinghands.application.service.DirectoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/directory")
@RequiredArgsConstructor
@Tag(name = "Directory", description = "Browse Donors/Service Providers (Children's Homes only)")
public class DirectoryController {

    private final DirectoryService directoryService;

    @GetMapping("/donors")
    @PreAuthorize("hasRole('CHILDRENS_HOME')")
    public ApiResponse<Page<DirectoryUserResponse>> listDonors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Retrieved", directoryService.listDonors(PageRequest.of(page, size)));
    }

    @GetMapping("/service-providers")
    @PreAuthorize("hasRole('CHILDRENS_HOME')")
    public ApiResponse<Page<DirectoryUserResponse>> listServiceProviders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok("Retrieved", directoryService.listServiceProviders(PageRequest.of(page, size)));
    }
}
