package com.helpinghands.infrastructure.repository;

import com.helpinghands.domain.entity.ChildrensHome;
import com.helpinghands.domain.entity.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChildrensHomeRepository extends JpaRepository<ChildrensHome, Long> {

    Optional<ChildrensHome> findByUserId(Long userId);

    boolean existsByRegistrationNumber(String registrationNumber);

    boolean existsByUserId(Long userId);

    Page<ChildrensHome> findByVerificationStatus(VerificationStatus status, Pageable pageable);

    long countByVerificationStatus(VerificationStatus status);
}
