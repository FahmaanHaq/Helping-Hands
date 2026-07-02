package com.helpinghands.infrastructure.repository;

import com.helpinghands.domain.entity.Request;
import com.helpinghands.domain.entity.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestRepository extends JpaRepository<Request, Long> {

    Page<Request> findByChildrensHomeId(Long childrensHomeId, Pageable pageable);

    Page<Request> findByStatus(RequestStatus status, Pageable pageable);

    Page<Request> findByPledgedById(Long userId, Pageable pageable);
}
