package com.helpinghands.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Deliberately lightweight rather than extending BaseEntity — a chat log is
 * append-only by nature (no "modifiedBy" concept for a sent message), but
 * isActive is kept so an Administrator can moderate an inappropriate
 * message later without a hard delete, consistent with the platform-wide
 * no-hard-delete rule.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "request_messages", indexes = {
        @Index(name = "idx_request_messages_request", columnList = "request_id, created_date")
})
public class RequestMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private Request request;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Column(name = "content", nullable = false, length = 2000)
    private String content;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate = LocalDateTime.now();
}
