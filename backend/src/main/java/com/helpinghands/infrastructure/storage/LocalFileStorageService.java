package com.helpinghands.infrastructure.storage;

import com.helpinghands.api.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

    @Value("${storage.local.base-path}")
    private String basePath;

    @Override
    public String store(MultipartFile file, String subFolder) {
        try {
            Path folder = Path.of(basePath, subFolder);
            Files.createDirectories(folder);

            String extension = extractExtension(file.getOriginalFilename());
            String storageKey = UUID.randomUUID() + extension;

            Path target = folder.resolve(storageKey);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            return storageKey;
        } catch (IOException e) {
            throw new ApiException("Failed to store file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public InputStream retrieve(String storageKey, String subFolder) {
        try {
            Path target = Path.of(basePath, subFolder, storageKey);
            if (!Files.exists(target)) {
                throw new ApiException("File not found in storage", HttpStatus.NOT_FOUND);
            }
            return Files.newInputStream(target);
        } catch (IOException e) {
            throw new ApiException("Failed to read file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Override
    public void delete(String storageKey, String subFolder) {
        try {
            Files.deleteIfExists(Path.of(basePath, subFolder, storageKey));
        } catch (IOException e) {
            throw new ApiException("Failed to delete file: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private String extractExtension(String originalFileName) {
        if (originalFileName == null || !originalFileName.contains(".")) {
            return "";
        }
        return originalFileName.substring(originalFileName.lastIndexOf('.'));
    }
}
