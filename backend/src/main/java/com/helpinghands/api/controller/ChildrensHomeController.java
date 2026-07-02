package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.childrenshome.ChildrensHomeRegistrationRequest;
import com.helpinghands.application.dto.childrenshome.ChildrensHomeResponse;
import com.helpinghands.application.service.ChildrensHomeService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/childrens-homes")
@RequiredArgsConstructor
@Tag(name = "Children's Homes", description = "Registration and profile lookup for Children's Home accounts")
public class ChildrensHomeController {

    private final ChildrensHomeService childrensHomeService;

    @PostMapping("/me")
    @PreAuthorize("hasRole('CHILDRENS_HOME')")
    public ResponseEntity<ApiResponse<ChildrensHomeResponse>> register(
            @Valid @RequestBody ChildrensHomeRegistrationRequest request) {
        ChildrensHomeResponse response = childrensHomeService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Registration submitted for review", response));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CHILDRENS_HOME')")
    public ResponseEntity<ApiResponse<ChildrensHomeResponse>> getMyProfile() {
        return ResponseEntity.ok(ApiResponse.ok("Profile retrieved", childrensHomeService.getMyProfile()));
    }
}
