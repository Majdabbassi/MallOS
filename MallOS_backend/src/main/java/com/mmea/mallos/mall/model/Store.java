package com.mmea.mallos.mall.model;

import com.mmea.mallos.mall.model.enums.StoreCategory;
import com.mmea.mallos.mall.model.enums.StoreStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "stores",
        indexes = @Index(columnList = "mall_id"),
        uniqueConstraints = @UniqueConstraint(name = "uk_stores_mall_code", columnNames = {"mall_id", "code"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mall_id")
    private Mall mall;

    @Column(nullable = false)
    private String name;

    /** Unique unit code per mall, e.g. "A-101" */
    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private StoreCategory category;

    /** Floor level (0 = ground, 1 = first, etc.) */
    @Column(nullable = false)
    private int floor;

    @Column
    private String zone;

    /** Area in m² */
    @Column
    private Double surface;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StoreStatus status = StoreStatus.VACANT;

    @Column
    private String ownerName;

    @Column
    private String ownerPhone;

    @Column
    private String ownerEmail;

    @Column
    private LocalDate contractStart;

    @Column
    private LocalDate contractEnd;

    @Column(precision = 10, scale = 2)
    private BigDecimal monthlyRent;

    @Column(columnDefinition = "TEXT")
    private String description;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
