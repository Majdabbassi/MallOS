package com.mmea.mallos.audit;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** One line of the mall's history: who did what, to what, and when. Entries are only ever added. */
@Entity
@Table(name = "audit_entries", indexes = @Index(name = "idx_audit_mall_time", columnList = "mall_id, created_at"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "mall_id", nullable = false)
    private Long mallId;

    /** Null for the scheduled jobs. */
    private Long actorId;

    @Column(nullable = false)
    private String actorName;

    /** e.g. STORE_UPDATED, INVOICE_PAID, PERMISSIONS_CHANGED */
    @Column(nullable = false)
    private String action;

    /** STORE, FLOOR, MEMBER, INVOICE, MALL */
    @Column(nullable = false)
    private String entityType;

    private Long entityId;

    /** The floor level the event concerns, when it concerns one (stores, floors, links). */
    private Integer floorLevel;

    @Column(nullable = false, length = 600)
    private String summary;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
