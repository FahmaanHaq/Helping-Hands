package com.helpinghands.infrastructure.repository;

import com.helpinghands.domain.entity.TokenType;
import com.helpinghands.domain.entity.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {

    Optional<VerificationToken> findByTokenHashAndTokenType(String tokenHash, TokenType tokenType);

    @Modifying
    @Query("DELETE FROM VerificationToken t WHERE t.user.id = :userId AND t.tokenType = :tokenType AND t.used = false")
    void deleteUnusedByUserIdAndType(@Param("userId") Long userId, @Param("tokenType") TokenType tokenType);
}
