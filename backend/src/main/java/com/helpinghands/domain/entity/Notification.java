package com.helpinghands.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notifications_recipient", columnList = "recipient_id, read")
})
public class Notification extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 40)
    private NotificationType type;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "message", nullable = false, length = 1000)
    private String message;

    /**
     * Frontend route to deep-link into when the notification is clicked,
     * e.g. "/requests/42". Null for notifications with no obvious destination
     * (e.g. account suspension).
     */
    @Column(name = "link", length = 300)
    private String link;

    @Column(name = "read", nullable = false)
    private Boolean read = false;
}
