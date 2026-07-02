package com.helpinghands.infrastructure.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * Abstraction over "where files physically live". LocalFileStorageService is
 * the only implementation today; a CloudFileStorageService (S3/Azure Blob/GCS)
 * can be added later and swapped in via a Spring profile without touching
 * DocumentService or any controller.
 */
public interface FileStorageService {

    /**
     * Persists the file and returns the storage key (e.g. a filename or object key)
     * needed to retrieve it later. Never returns a full filesystem path — callers
     * shouldn't know or care whether storage is local disk or a cloud bucket.
     */
    String store(MultipartFile file, String subFolder);

    InputStream retrieve(String storageKey, String subFolder);

    void delete(String storageKey, String subFolder);
}
