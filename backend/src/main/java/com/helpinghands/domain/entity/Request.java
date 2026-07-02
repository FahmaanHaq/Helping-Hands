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
        name = "requests",
        indexes = {
                @Index(name = "idx_requests_status", columnList = "status"),
                @Index(name = "idx_requests_category", columnList = "goods_category, service_category"),
                @Index(name = "idx_requests_home", columnList = "childrens_home_id")
        }
)
public class Request extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "childrens_home_id", nullable = false)
    private ChildrensHome childrensHome;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 20)
    private RequestType requestType;

    @Enumerated(EnumType.STRING)
    @Column(name = "goods_category", length = 30)
    private GoodsCategory goodsCategory; // set when requestType == GOODS

    @Enumerated(EnumType.STRING)
    @Column(name = "service_category", length = 30)
    private ServiceCategory serviceCategory; // set when requestType == SERVICE

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "quantity")
    private Integer quantity; // meaningful for GOODS; null for SERVICE

    @Enumerated(EnumType.STRING)
    @Column(name = "urgency", nullable = false, length = 20)
    private UrgencyLevel urgency = UrgencyLevel.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private RequestStatus status = RequestStatus.CREATED;

    /**
     * The Donor (for GOODS) or Service Provider (for SERVICE) who pledged to
     * fulfil this request. Null until status reaches PLEDGED.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pledged_by_user_id")
    private User pledgedBy;

    @Column(name = "cancellation_reason", length = 1000)
    private String cancellationReason;

    public boolean isGoods() {
        return requestType == RequestType.GOODS;
    }
}
