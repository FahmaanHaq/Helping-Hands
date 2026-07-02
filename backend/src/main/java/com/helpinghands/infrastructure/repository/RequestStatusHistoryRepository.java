package com.helpinghands.infrastructure.repository;

import com.helpinghands.domain.entity.RequestStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RequestStatusHistoryRepository extends JpaRepository<RequestStatusHistory, Long> {
    List<RequestStatusHistory> findByRequestIdOrderByChangedDateAsc(Long requestId);
}
