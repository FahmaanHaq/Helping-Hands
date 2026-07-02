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
        name = "ratings",
        uniqueConstraints = @UniqueConstraint(name = "uk_ratings_request", columnNames = "request_id"),
        indexes = @Index(name = "idx_ratings_rated_user", columnList = "rated_user_id")
)
public class Rating extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private Request request;

    /**
     * The Donor or Service Provider being rated — i.e. request.pledgedBy at
     * the time of rating. Denormalized onto the rating itself (rather than
     * always joining through request) so reputation aggregate queries don't
     * need to join the requests table at all.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rated_user_id", nullable = false)
    private User ratedUser;

    @Column(name = "score", nullable = false)
    private Integer score; // 1-5

    @Column(name = "comment", length = 1000)
    private String comment;
}
