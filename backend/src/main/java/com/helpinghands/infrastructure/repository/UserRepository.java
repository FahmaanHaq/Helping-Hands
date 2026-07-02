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

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :term, '%'))")
    org.springframework.data.domain.Page<User> search(@Param("term") String term, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT COUNT(DISTINCT u) FROM User u JOIN u.roles r WHERE r.name = :roleName")
    long countByRoleName(@Param("roleName") com.helpinghands.domain.entity.RoleName roleName);

    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.isActive = true")
    java.util.List<User> findAllActiveByRoleName(@Param("roleName") com.helpinghands.domain.entity.RoleName roleName);

    long countByAccountLockedTrue();

    @Query("SELECT u FROM User u WHERE u.isActive = true AND " +
           "(u.lastLoginDate IS NOT NULL AND u.lastLoginDate < :cutoff)")
    java.util.List<User> findInactiveSince(@Param("cutoff") java.time.LocalDateTime cutoff);
}
