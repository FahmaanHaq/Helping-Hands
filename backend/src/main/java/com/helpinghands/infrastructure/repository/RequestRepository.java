package com.helpinghands.infrastructure.repository;

import com.helpinghands.domain.entity.Request;
import com.helpinghands.domain.entity.RequestStatus;
import com.helpinghands.domain.entity.RequestType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RequestRepository extends JpaRepository<Request, Long>, JpaSpecificationExecutor<Request> {

    Page<Request> findByChildrensHomeId(Long childrensHomeId, Pageable pageable);

    Page<Request> findByStatus(RequestStatus status, Pageable pageable);

    Page<Request> findByPledgedById(Long userId, Pageable pageable);

    long countByRequestType(RequestType requestType);

    long countByStatus(RequestStatus status);

    @Query("SELECT COUNT(r) FROM Request r WHERE r.pledgedBy.id = :userId AND r.status = 'CANCELLED'")
    long countCancelledByPledgedUser(@Param("userId") Long userId);

    @Query("SELECT COUNT(r) FROM Request r WHERE r.childrensHome.id = :homeId AND r.status = 'CANCELLED'")
    long countCancelledByHome(@Param("homeId") Long homeId);

    @Query("SELECT r FROM Request r WHERE r.status = 'CREATED' AND r.createdDate < :cutoff")
    java.util.List<Request> findStaleUnpledged(@Param("cutoff") java.time.LocalDateTime cutoff);

    @Query("SELECT r FROM Request r WHERE r.status IN ('ACCEPTED', 'IN_PROGRESS') AND r.modifiedDate < :cutoff")
    java.util.List<Request> findStalledInProgress(@Param("cutoff") java.time.LocalDateTime cutoff);

    @Query("SELECT r FROM Request r WHERE r.deliveryMethod = 'VOLUNTEER_PICKUP' " +
           "AND r.status IN ('PLEDGED', 'ACCEPTED') AND r.modifiedDate < :cutoff")
    java.util.List<Request> findStalledVolunteerPickup(@Param("cutoff") java.time.LocalDateTime cutoff);
}
