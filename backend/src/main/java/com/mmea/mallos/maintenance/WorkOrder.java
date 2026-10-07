package com.mmea.mallos.maintenance;

import com.mmea.mallos.mall.model.Mall;
import com.mmea.mallos.mall.model.Store;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A maintenance job in a mall (a leaking roof in unit B-202, an escalator out of order): reported, assigned to a
 * contractor, done or canceled. Optionally tied to a store. Closed orders are kept as history, never deleted.
 */
@Entity
@Table(name = "work_orders", indexes = @Index(name = "idx_work_orders_mall_status", columnList = "mall_id, status"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkOrder {

    public enum Priority { LOW, NORMAL, HIGH, URGENT }

    public enum Status { OPEN, IN_PROGRESS, DONE, CANCELED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mall_id")
    private Mall mall;

    @ManyToOne
    @JoinColumn(name = "store_id")
    private Store store;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private Status status;

    /** Who does the work: a contractor or a member of staff, as free text. */
    @Column(length = 160)
    private String assignee;

    /** What the job cost, filled when it is done (optional). */
    @Column(precision = 10, scale = 2)
    private BigDecimal cost;

    private Long reportedById;
    private String reportedByName;

    @Column(nullable = false)
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime closedAt;
}
