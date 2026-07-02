package com.helpinghands.infrastructure.repository;

import com.helpinghands.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsernameAndIsActiveTrue(String username);

    Optional<User> findByEmailAndIsActiveTrue(String email);

    @Query("SELECT u FROM User u WHERE u.isActive = true " +
           "AND (u.username = :identifier OR u.email = :identifier)")
    Optional<User> findActiveByUsernameOrEmail(@Param("identifier") String identifier);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);
}
