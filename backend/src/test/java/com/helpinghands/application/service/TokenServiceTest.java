package com.helpinghands.application.service;

import com.helpinghands.domain.entity.TokenType;
import com.helpinghands.domain.entity.User;
import com.helpinghands.domain.entity.VerificationToken;
import com.helpinghands.infrastructure.repository.VerificationTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenServiceTest {

    @Mock private VerificationTokenRepository tokenRepository;

    private TokenService tokenService;
    private User user;

    @BeforeEach
    void setUp() {
        tokenService = new TokenService(tokenRepository);
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
    }

    @Test
    void issueToken_invalidatesPriorUnusedTokens_beforeIssuingNew() {
        tokenService.issueToken(user, TokenType.EMAIL_VERIFICATION, 60);

        verify(tokenRepository).deleteUnusedByUserIdAndType(user.getId(), TokenType.EMAIL_VERIFICATION);
        verify(tokenRepository).save(any(VerificationToken.class));
    }

    @Test
    void issueToken_neverPersistsTheRawTokenValue() {
        ArgumentCaptor<VerificationToken> captor = ArgumentCaptor.forClass(VerificationToken.class);

        String rawToken = tokenService.issueToken(user, TokenType.PASSWORD_RESET, 60);

        verify(tokenRepository).save(captor.capture());
        VerificationToken saved = captor.getValue();

        assertNotEquals(rawToken, saved.getTokenHash(), "The raw token must never be stored as-is");
        assertEquals(64, saved.getTokenHash().length(), "SHA-256 hex digest should be 64 characters");
    }

    @Test
    void consumeToken_withValidUnexpiredToken_returnsUserAndMarksUsed() {
        String rawToken = "known-raw-token-value";
        VerificationToken stored = tokenFor(user, TokenType.EMAIL_VERIFICATION, false, LocalDateTime.now().plusHours(1));

        when(tokenRepository.findByTokenHashAndTokenType(anyString(), eq(TokenType.EMAIL_VERIFICATION)))
                .thenReturn(Optional.of(stored));

        Optional<User> result = tokenService.consumeToken(rawToken, TokenType.EMAIL_VERIFICATION);

        assertTrue(result.isPresent());
        assertEquals(user, result.get());
        assertTrue(stored.getUsed(), "Token should be marked used after consumption");
        verify(tokenRepository).save(stored);
    }

    @Test
    void consumeToken_alreadyUsed_isRejected() {
        VerificationToken stored = tokenFor(user, TokenType.PASSWORD_RESET, true, LocalDateTime.now().plusHours(1));
        when(tokenRepository.findByTokenHashAndTokenType(anyString(), eq(TokenType.PASSWORD_RESET)))
                .thenReturn(Optional.of(stored));

        Optional<User> result = tokenService.consumeToken("some-token", TokenType.PASSWORD_RESET);

        assertTrue(result.isEmpty(), "A previously-used token must not be usable again (replay protection)");
    }

    @Test
    void consumeToken_expired_isRejected() {
        VerificationToken stored = tokenFor(user, TokenType.PASSWORD_RESET, false, LocalDateTime.now().minusMinutes(1));
        when(tokenRepository.findByTokenHashAndTokenType(anyString(), eq(TokenType.PASSWORD_RESET)))
                .thenReturn(Optional.of(stored));

        Optional<User> result = tokenService.consumeToken("some-token", TokenType.PASSWORD_RESET);

        assertTrue(result.isEmpty());
    }

    @Test
    void consumeToken_unknownToken_isRejected() {
        when(tokenRepository.findByTokenHashAndTokenType(anyString(), any()))
                .thenReturn(Optional.empty());

        Optional<User> result = tokenService.consumeToken("nonexistent-token", TokenType.EMAIL_VERIFICATION);

        assertTrue(result.isEmpty());
    }

    private VerificationToken tokenFor(User user, TokenType type, boolean used, LocalDateTime expiry) {
        VerificationToken token = new VerificationToken();
        token.setUser(user);
        token.setTokenType(type);
        token.setUsed(used);
        token.setExpiryDate(expiry);
        return token;
    }
}
