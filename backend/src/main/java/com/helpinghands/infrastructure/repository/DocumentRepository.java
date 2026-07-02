package com.helpinghands.infrastructure.repository;

import com.helpinghands.domain.entity.Document;
import com.helpinghands.domain.entity.DocumentOwnerType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByOwnerTypeAndOwnerIdAndIsActiveTrue(DocumentOwnerType ownerType, Long ownerId);
}
