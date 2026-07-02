package com.helpinghands.infrastructure.storage;

import com.helpinghands.api.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;

/**
 * Encrypts every file at rest with AES-256-GCM before writing to disk, and
 * decrypts on read — satisfies the requirement that sensitive documents
 * (police clearance, registration proofs) never sit on disk in plaintext.
 * The encryption key lives only in STORAGE_ENCRYPTION_KEY (env var), never
 * in code or the database; losing that key makes existing files permanently
 * unreadable, so back it up the same way you'd back up a database credential.
 */
@Service
public class LocalFileStorageService implements FileStorageService {

    private static final int GCM_IV_LENGTH_BYTES = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Value("${storage.local.base-path}")
    private String basePath;

    @Value("${storage.encryption-key}")
    private String encryptionKeyBase64;

    @Override
    public String store(MultipartFile file, String subFolder) {
        try {
            Path folder = Path.of(basePath, subFolder);
            Files.createDirectories(folder);

            String extension = extractExtension(file.getOriginalFilename());
            String storageKey = UUID.randomUUID() + extension;
            Path target = folder.resolve(storageKey);

            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            SECURE_RANDOM.nextBytes(iv);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey(), new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));

            // IV is not secret — it's stored as a plaintext prefix on the file
            // (standard practice for GCM) so decryption knows where to start.
            try (var out = Files.newOutputStream(target)) {
                out.write(iv);
                try (CipherOutputStream cipherOut = new CipherOutputStream(out, cipher);
                     InputStream in = file.getInputStream()) {
                    in.transferTo(cipherOut);
                }
            }

            return storageKey;
        } catch (Exception e) {
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

            InputStream fileIn = Files.newInputStream(target);
            byte[] iv = fileIn.readNBytes(GCM_IV_LENGTH_BYTES);

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey(), new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));

            return new CipherInputStream(fileIn, cipher);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
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

    private SecretKeySpec secretKey() {
        byte[] keyBytes = Base64.getDecoder().decode(encryptionKeyBase64);
        return new SecretKeySpec(keyBytes, "AES");
    }

    private String extractExtension(String originalFileName) {
        if (originalFileName == null || !originalFileName.contains(".")) {
            return "";
        }
        return originalFileName.substring(originalFileName.lastIndexOf('.'));
    }
}
