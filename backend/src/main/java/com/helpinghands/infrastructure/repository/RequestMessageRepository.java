package com.helpinghands.infrastructure.repository;

import com.helpinghands.domain.entity.RequestMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequestMessageRepository extends JpaRepository<RequestMessage, Long> {
    List<RequestMessage> findByRequestIdAndIsActiveTrueOrderByCreatedDateAsc(Long requestId);
}
