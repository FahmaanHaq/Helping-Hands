package com.helpinghands.infrastructure.repository;

import com.helpinghands.domain.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {

    Optional<Rating> findByRequestId(Long requestId);

    boolean existsByRequestId(Long requestId);

    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.ratedUser.id = :userId AND r.isActive = true")
    Double findAverageScoreByRatedUserId(@Param("userId") Long userId);

    long countByRatedUserIdAndIsActiveTrue(Long userId);

    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.isActive = true")
    Double findPlatformAverageScore();

    long countByIsActiveTrue();
}
