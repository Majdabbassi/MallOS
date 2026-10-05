package com.mmea.mallos.finance;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** What the API returns for invoices and the money summary. */
public final class InvoiceDtos {

    private InvoiceDtos() {
    }

    public record InvoiceView(Long id, Long storeId, String storeCode, String storeName, String tenantName,
                              String period, BigDecimal amount, BigDecimal lateFee, BigDecimal total,
                              LocalDate dueDate, InvoiceStatus status, boolean late, long daysLate, LocalDate paidDate) {
    }

    public record Generated(String period, int created, int alreadyBilled, int notBillable) {
    }

    public record Debtor(Long storeId, String storeCode, String storeName, String tenantName, int unpaidInvoices,
                         BigDecimal owed, BigDecimal overdue, BigDecimal lateFees, LocalDate oldestDueDate) {
    }

    public record Summary(String period, BigDecimal billed, BigDecimal collected, double collectionRate,
                          BigDecimal outstanding, BigDecimal overdue, BigDecimal lateFees, List<Debtor> debtors) {
    }
}
