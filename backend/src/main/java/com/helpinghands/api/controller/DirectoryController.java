package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.directory.DirectoryUserResponse;
import com.helpinghands.application.service.DirectoryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/directory")
@RequiredArgsConstructor
@Tag(name = "Directory", description = "Browse Donors/Service Providers (Children's Homes only)")
public class DirectoryController {

    private final DirectoryService directoryService;

    @GetMapping("/donors")
    @PreAuthorize("hasRole('CHILDRENS_HOME')")
    public ApiResponse<List<DirectoryUserResponse>> listDonors() {
        return ApiResponse.ok("Retrieved", directoryService.listDonors());
    }

    @GetMapping("/service-providers")
    @PreAuthorize("hasRole('CHILDRENS_HOME')")
    public ApiResponse<List<DirectoryUserResponse>> listServiceProviders() {
        return ApiResponse.ok("Retrieved", directoryService.listServiceProviders());
    }
}
