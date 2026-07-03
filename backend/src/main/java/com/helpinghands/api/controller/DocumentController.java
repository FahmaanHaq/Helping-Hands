package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.document.DocumentResponse;
import com.helpinghands.application.service.DocumentService;
import com.helpinghands.domain.entity.DocumentOwnerType;
import com.helpinghands.domain.entity.DocumentType;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
@Tag(name = "Documents", description = "Upload and retrieve verification documents")
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponse>> upload(
            @RequestParam DocumentOwnerType ownerType,
            @RequestParam Long ownerId,
            @RequestParam DocumentType documentType,
            @RequestParam(required = false) String remarks,
            @RequestParam MultipartFile file) {

        DocumentResponse response = documentService.upload(ownerType, ownerId, documentType, remarks, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Document uploaded", response));
    }

    @GetMapping
    public ApiResponse<List<DocumentResponse>> list(
            @RequestParam DocumentOwnerType ownerType,
            @RequestParam Long ownerId) {
        return ApiResponse.ok("Retrieved", documentService.list(ownerType, ownerId));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> download(@PathVariable Long id) {
        DocumentService.DownloadPayload payload = documentService.download(id);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(payload.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(payload.fileName()).build().toString())
                .body(new InputStreamResource(payload.stream()));
    }

    /**
     * Self-service removal for the owning Children's Home's own request
     * images — distinct from the admin-only moderation removal at
     * /api/v1/admin/moderation/documents/{id}. See DocumentService.removeOwnRequestImage
     * for the exact rules (REQUEST images only, only while status is CREATED).
     */
    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('CHILDRENS_HOME')")
    public ApiResponse<Void> removeOwn(@PathVariable Long id) {
        documentService.removeOwnRequestImage(id);
        return ApiResponse.ok("Document removed", null);
    }
}
