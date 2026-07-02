package com.helpinghands.application.service;

import com.helpinghands.api.exception.ApiException;
import com.helpinghands.application.dto.document.DocumentResponse;
import com.helpinghands.domain.entity.*;
import com.helpinghands.infrastructure.repository.ChildrensHomeRepository;
import com.helpinghands.infrastructure.repository.DocumentRepository;
import com.helpinghands.infrastructure.repository.RequestRepository;
import com.helpinghands.infrastructure.repository.ServiceProviderRepository;
import com.helpinghands.infrastructure.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024; // 10 MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf", "image/jpeg", "image/png", "image/jpg"
    );

    private final DocumentRepository documentRepository;
    private final ChildrensHomeRepository childrensHomeRepository;
    private final ServiceProviderRepository serviceProviderRepository;
    private final RequestRepository requestRepository;
    private final FileStorageService fileStorageService;
    private final CurrentUserResolver currentUserResolver;

    @Transactional
    public DocumentResponse upload(DocumentOwnerType ownerType, Long ownerId, DocumentType documentType,
                                    String remarks, MultipartFile file) {
        validateFile(file);
        assertCanUpload(ownerType, ownerId);
        assertNoDuplicate(ownerType, ownerId, documentType, file.getOriginalFilename());

        String subFolder = ownerType.name().toLowerCase();
        String storageKey = fileStorageService.store(file, subFolder);

        Document document = new Document();
        document.setOwnerType(ownerType);
        document.setOwnerId(ownerId);
        document.setDocumentType(documentType);
        document.setOriginalFileName(file.getOriginalFilename());
        document.setStoredFileName(storageKey);
        document.setContentType(file.getContentType());
        document.setFileSizeBytes(file.getSize());
        document.setRemarks(remarks);

        return toResponse(documentRepository.save(document));
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> list(DocumentOwnerType ownerType, Long ownerId) {
        assertCanView(ownerType, ownerId);
        return documentRepository.findByOwnerTypeAndOwnerIdAndIsActiveTrue(ownerType, ownerId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DownloadPayload download(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ApiException("Document not found", HttpStatus.NOT_FOUND));

        assertCanView(document.getOwnerType(), document.getOwnerId());

        String subFolder = document.getOwnerType().name().toLowerCase();
        InputStream stream = fileStorageService.retrieve(document.getStoredFileName(), subFolder);

        return new DownloadPayload(stream, document.getOriginalFileName(), document.getContentType());
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException("A file is required", HttpStatus.BAD_REQUEST);
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new ApiException("File exceeds the 10MB size limit", HttpStatus.BAD_REQUEST);
        }
        if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new ApiException("Only PDF, JPG, and PNG files are accepted", HttpStatus.BAD_REQUEST);
        }
    }

    private void assertNoDuplicate(DocumentOwnerType ownerType, Long ownerId, DocumentType documentType, String fileName) {
        boolean duplicate = documentRepository.findByOwnerTypeAndOwnerIdAndIsActiveTrue(ownerType, ownerId)
                .stream()
                .anyMatch(d -> d.getDocumentType() == documentType && d.getOriginalFileName().equals(fileName));
        if (duplicate) {
            throw new ApiException(
                    "A document of this type with the same file name has already been uploaded",
                    HttpStatus.CONFLICT);
        }
    }

    /**
     * Only the profile's own user (or an Administrator) may upload a document
     * to it — applies to all owner types, including REQUEST, since only the
     * owning Children's Home should be able to attach images to its own request.
     */
    private void assertCanUpload(DocumentOwnerType ownerType, Long ownerId) {
        assertIsOwnerOrAdmin(ownerType, ownerId);
    }

    /**
     * Viewing rules differ by owner type: verification documents (Children's Home /
     * Service Provider) stay private to the owner and Administrators, since they
     * contain sensitive personal/registration data. Request images are part of a
     * public marketplace listing — any authenticated user browsing requests needs
     * to see them, so no ownership check is applied there.
     */
    private void assertCanView(DocumentOwnerType ownerType, Long ownerId) {
        if (ownerType == DocumentOwnerType.REQUEST) {
            currentUserResolver.getCurrentUser(); // still requires authentication, just not ownership
            return;
        }
        assertIsOwnerOrAdmin(ownerType, ownerId);
    }

    /**
     * Confirms the caller either IS the owner (their user_id matches the home/provider's
     * user_id) or is an Administrator. Thrown as 403 rather than 404 to distinguish
     * "exists but not yours" from "doesn't exist" — deliberate here since document
     * ownership isn't sensitive to enumerate, unlike e.g. user accounts.
     */
    private void assertIsOwnerOrAdmin(DocumentOwnerType ownerType, Long ownerId) {
        User currentUser = currentUserResolver.getCurrentUser();

        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleName.ADMINISTRATOR);
        if (isAdmin) return;

        Long resolvedOwnerUserId = switch (ownerType) {
            case CHILDRENS_HOME -> childrensHomeRepository.findById(ownerId)
                    .map(h -> h.getUser().getId())
                    .orElseThrow(() -> new ApiException("Children's Home not found", HttpStatus.NOT_FOUND));
            case SERVICE_PROVIDER -> serviceProviderRepository.findById(ownerId)
                    .map(p -> p.getUser().getId())
                    .orElseThrow(() -> new ApiException("Service Provider not found", HttpStatus.NOT_FOUND));
            case REQUEST -> requestRepository.findById(ownerId)
                    .map(r -> r.getChildrensHome().getUser().getId())
                    .orElseThrow(() -> new ApiException("Request not found", HttpStatus.NOT_FOUND));
        };

        if (!resolvedOwnerUserId.equals(currentUser.getId())) {
            throw new ApiException("You do not have access to this resource", HttpStatus.FORBIDDEN);
        }
    }

    private DocumentResponse toResponse(Document document) {
        return new DocumentResponse(
                document.getId(),
                document.getOwnerType(),
                document.getOwnerId(),
                document.getDocumentType(),
                document.getOriginalFileName(),
                document.getContentType(),
                document.getFileSizeBytes(),
                document.getRemarks(),
                document.getCreatedDate()
        );
    }

    public record DownloadPayload(InputStream stream, String fileName, String contentType) {}
}
