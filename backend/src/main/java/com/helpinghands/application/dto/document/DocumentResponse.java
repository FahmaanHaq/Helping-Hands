package com.helpinghands.application.dto.document;

import com.helpinghands.domain.entity.DocumentOwnerType;
import com.helpinghands.domain.entity.DocumentType;

import java.time.LocalDateTime;

public record DocumentResponse(
        Long id,
        DocumentOwnerType ownerType,
        Long ownerId,
        DocumentType documentType,
        String originalFileName,
        String contentType,
        Long fileSizeBytes,
        String remarks,
        LocalDateTime uploadedDate
) {
}
