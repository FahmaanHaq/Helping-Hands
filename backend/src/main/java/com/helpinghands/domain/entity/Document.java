package com.helpinghands.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "documents",
        indexes = {
                @Index(name = "idx_documents_owner", columnList = "owner_type, owner_id")
        }
)
public class Document extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false, length = 30)
    private DocumentOwnerType ownerType;

    /**
     * References ChildrensHome.id or ServiceProvider.id depending on ownerType.
     * Not a JPA foreign key on purpose — a single documents table serving two
     * owner tables can't use a real FK constraint without a discriminator join,
     * and ownership is always validated in DocumentService before any access anyway.
     */
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 40)
    private DocumentType documentType;

    @Column(name = "original_file_name", nullable = false, length = 255)
    private String originalFileName;

    @Column(name = "stored_file_name", nullable = false, length = 255)
    private String storedFileName;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    @Column(name = "remarks", length = 500)
    private String remarks;
}
