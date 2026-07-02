package com.helpinghands.application.service;

import com.helpinghands.domain.entity.TokenType;
import com.helpinghands.domain.entity.User;
import com.helpinghands.domain.entity.VerificationToken;
import com.helpinghands.infrastructure.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final VerificationTokenRepository tokenRepository;

    /**
     * Returns the raw token (goes in the email link, never persisted) after
     * storing only its hash. Invalidates any previous unused token of the
     * same type for this user first, so only the most recent link works.
     */
    @Transactional
    public String issueToken(User user, TokenType type, long validityMinutes) {
        tokenRepository.deleteUnusedByUserIdAndType(user.getId(), type);

        String rawToken = generateRawToken();

        VerificationToken token = new VerificationToken();
        token.setUser(user);
        token.setTokenHash(hash(rawToken));
        token.setTokenType(type);
        token.setExpiryDate(LocalDateTime.now().plusMinutes(validityMinutes));
        tokenRepository.save(token);

        return rawToken;
    }

    /**
     * Validates and consumes a token in one step (marks it used) so it can't
     * be replayed. Returns empty if the token doesn't exist, is expired, is
     * of the wrong type, or was already used.
     */
    @Transactional
    public Optional<User> consumeToken(String rawToken, TokenType type) {
        Optional<VerificationToken> tokenOpt = tokenRepository.findByTokenHashAndTokenType(hash(rawToken), type);

        if (tokenOpt.isEmpty()) return Optional.empty();

        VerificationToken token = tokenOpt.get();
        if (token.getUsed() || token.isExpired()) return Optional.empty();

        token.setUsed(true);
        tokenRepository.save(token);

        return Optional.of(token.getUser());
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawToken.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : hashBytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
