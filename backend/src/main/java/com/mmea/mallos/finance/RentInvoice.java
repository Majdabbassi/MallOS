package com.mmea.mallos.finance;

import com.mmea.mallos.mall.model.Mall;
import com.mmea.mallos.mall.model.Store;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** The rent a store owes for one month. One invoice per store and month, so generating twice changes nothing. */
@Entity
@Table(name = "rent_invoices",
        uniqueConstraints = @UniqueConstraint(name = "uk_invoice_store_period", columnNames = {"store_id", "period"}),
        indexes = @Index(name = "idx_invoice_mall_period", columnList = "mall_id, period"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mall_id")
    private Mall mall;

    @ManyToOne(optional = false)
    @JoinColumn(name = "store_id")
    private Store store;

    /** The month, "2026-10". */
    @Column(nullable = false, length = 7)
    private String period;

    /** Rent for the month; less than the store's rent when the lease starts or ends inside the month. */
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    /** One-off fee added once the invoice is past its due date (0 until then). */
    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal lateFee = BigDecimal.ZERO;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.UNPAID;

    private LocalDate paidDate;

    /** Who was billed, as it was when the invoice was made: later changes to the store do not rewrite history. */
    private String tenantName;
    private String storeCode;
    private String storeName;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
