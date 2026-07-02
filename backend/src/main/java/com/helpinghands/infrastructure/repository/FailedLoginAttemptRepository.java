package com.helpinghands.infrastructure.repository;

import com.helpinghands.domain.entity.FailedLoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface FailedLoginAttemptRepository extends JpaRepository<FailedLoginAttempt, Long> {

    @Query("SELECT COUNT(f) FROM FailedLoginAttempt f WHERE f.identifier = :identifier AND f.attemptedAt > :since")
    long countRecentByIdentifier(@Param("identifier") String identifier, @Param("since") LocalDateTime since);
}
