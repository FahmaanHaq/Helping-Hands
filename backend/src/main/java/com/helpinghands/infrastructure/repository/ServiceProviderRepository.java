package com.helpinghands.infrastructure.repository;

import com.helpinghands.domain.entity.ServiceProvider;
import com.helpinghands.domain.entity.VerificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServiceProviderRepository extends JpaRepository<ServiceProvider, Long> {

    Optional<ServiceProvider> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    Page<ServiceProvider> findByVerificationStatus(VerificationStatus status, Pageable pageable);
}
