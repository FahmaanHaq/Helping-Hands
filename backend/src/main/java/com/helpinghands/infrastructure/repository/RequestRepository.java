package com.helpinghands.infrastructure.repository;

import com.helpinghands.domain.entity.Request;
import com.helpinghands.domain.entity.RequestStatus;
import com.helpinghands.domain.entity.RequestType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface RequestRepository extends JpaRepository<Request, Long>, JpaSpecificationExecutor<Request> {

    Page<Request> findByChildrensHomeId(Long childrensHomeId, Pageable pageable);

    Page<Request> findByStatus(RequestStatus status, Pageable pageable);

    Page<Request> findByPledgedById(Long userId, Pageable pageable);

    long countByRequestType(RequestType requestType);

    long countByStatus(RequestStatus status);
}
