package com.mmea.mallos.finance;

import com.mmea.mallos.audit.AuditService;
import com.mmea.mallos.finance.InvoiceDtos.Debtor;
import com.mmea.mallos.finance.InvoiceDtos.Generated;
import com.mmea.mallos.finance.InvoiceDtos.InvoiceView;
import com.mmea.mallos.finance.InvoiceDtos.Summary;
import com.mmea.mallos.mall.exception.InvalidMallOperationException;
import com.mmea.mallos.mall.model.Mall;
import com.mmea.mallos.mall.model.Store;
import com.mmea.mallos.mall.model.enums.MallPermission;
import com.mmea.mallos.mall.model.enums.StoreStatus;
import com.mmea.mallos.mall.exception.MallNotFoundException;
import com.mmea.mallos.mall.repository.MallRepository;
import com.mmea.mallos.mall.repository.StoreRepository;
import com.mmea.mallos.mall.service.PermissionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Monthly rent invoices.
 *
 * <ul>
 *   <li>A store is billed for a month when it is not vacant, has a rent and a lease start, and its lease touches the
 *       month. A lease that starts or ends inside the month is charged for the days it covers only.</li>
 *   <li>The invoice is due on the {@code due-day} of the month. Once it is past due and unpaid it carries a one-off
 *       late fee of {@code late-fee-percent} of the rent.</li>
 *   <li>The daily job bills the current month for every mall and applies late fees; managers can also run it by hand
 *       (for a past month too) from the finance screen.</li>
 * </ul>
 */
@Service
public class InvoiceService {

    private final RentInvoiceRepository invoices;
    private final StoreRepository stores;
    private final MallRepository malls;
    private final PermissionService permissions;
    private final AuditService audit;

    private final int dueDay;
    private final BigDecimal lateFeePercent;

    public InvoiceService(RentInvoiceRepository invoices, StoreRepository stores, MallRepository malls,
                          PermissionService permissions, AuditService audit,
                          @Value("${mallos.finance.due-day:5}") int dueDay,
                          @Value("${mallos.finance.late-fee-percent:5}") BigDecimal lateFeePercent) {
        this.invoices = invoices;
        this.stores = stores;
        this.malls = malls;
        this.permissions = permissions;
        this.audit = audit;
        this.dueDay = Math.max(1, Math.min(dueDay, 28));
        this.lateFeePercent = lateFeePercent;
    }

    // ------------------------------------------------------------------ the daily job

    @Scheduled(cron = "${mallos.finance.cron:0 30 5 * * *}")
    @Transactional
    public void dailyRun() {
        for (Mall mall : malls.findAll()) {
            generate(null, mall, YearMonth.now());
            applyLateFees(null, mall.getId());
        }
    }

    // ------------------------------------------------------------------ use cases

    @Transactional
    public Generated generate(Long userId, Long mallId, String period) {
        permissions.assertAccess(userId, mallId, MallPermission.MANAGE_FINANCE);
        Mall mall = malls.findById(mallId).orElseThrow(MallNotFoundException::new);
        return generate(userId, mall, parse(period));
    }

    private Generated generate(Long userId, Mall mall, YearMonth month) {
        String period = month.toString();
        int created = 0;
        int already = 0;
        int notBillable = 0;
        for (Store store : stores.findByMall_IdOrderByCodeAsc(mall.getId())) {
            BigDecimal amount = amountFor(store, month);
            if (amount == null) {
                notBillable++;
            } else if (invoices.existsByStore_IdAndPeriod(store.getId(), period)) {
                already++;
            } else {
                invoices.save(RentInvoice.builder()
                        .mall(mall).store(store).period(period).amount(amount)
                        .dueDate(month.atDay(dueDay)).tenantName(store.getOwnerName())
                        .storeCode(store.getCode()).storeName(store.getName()).build());
                created++;
            }
        }
        if (created > 0) {
            audit.record(userId, mall.getId(), "INVOICES_GENERATED", "INVOICE", null, null,
                    created + " rent " + (created == 1 ? "invoice" : "invoices") + " issued for " + period);
        }
        return new Generated(period, created, already, notBillable);
    }

    /** What a store owes for the month, or null when it is not billed that month. */
    BigDecimal amountFor(Store store, YearMonth month) {
        if (store.getStatus() == StoreStatus.VACANT || store.getMonthlyRent() == null
                || store.getMonthlyRent().signum() <= 0 || store.getContractStart() == null) {
            return null;
        }
        LocalDate first = month.atDay(1);
        LocalDate last = month.atEndOfMonth();
        LocalDate from = store.getContractStart().isAfter(first) ? store.getContractStart() : first;
        LocalDate to = store.getContractEnd() != null && store.getContractEnd().isBefore(last) ? store.getContractEnd() : last;
        if (to.isBefore(from)) {
            return null; // the lease starts after the month or ended before it
        }
        long days = ChronoUnit.DAYS.between(from, to) + 1;
        if (days == month.lengthOfMonth()) {
            return store.getMonthlyRent().setScale(2, RoundingMode.HALF_UP);
        }
        return store.getMonthlyRent().multiply(BigDecimal.valueOf(days))
                .divide(BigDecimal.valueOf(month.lengthOfMonth()), 2, RoundingMode.HALF_UP);
    }

    @Transactional(readOnly = true)
    public List<InvoiceView> list(Long userId, Long mallId, String period, String state) {
        permissions.assertAccess(userId, mallId, MallPermission.VIEW_FINANCE);
        List<RentInvoice> rows = period == null || period.isBlank()
                ? invoices.findByMall_IdOrderByPeriodDescStoreCodeAsc(mallId)
                : invoices.findByMall_IdAndPeriodOrderByStoreCodeAsc(mallId, parse(period).toString());
        LocalDate today = LocalDate.now();
        return rows.stream().map(i -> view(i, today))
                .filter(v -> state == null || state.isBlank() || matches(v, state))
                .toList();
    }

    private static boolean matches(InvoiceView v, String state) {
        return switch (state.trim().toUpperCase()) {
            case "LATE" -> v.late();
            case "UNPAID", "PAID", "CANCELED" -> v.status().name().equals(state.trim().toUpperCase());
            default -> throw new InvalidMallOperationException("state must be UNPAID, PAID, LATE or CANCELED");
        };
    }

    @Transactional
    public InvoiceView pay(Long userId, Long mallId, Long invoiceId) {
        permissions.assertAccess(userId, mallId, MallPermission.MANAGE_FINANCE);
        RentInvoice invoice = invoices.findByIdAndMall_Id(invoiceId, mallId).orElseThrow(InvoiceNotFoundException::new);
        if (invoice.getStatus() != InvoiceStatus.UNPAID) {
            throw new InvoiceStateException("Invoice " + label(invoice) + " is " + invoice.getStatus().name().toLowerCase());
        }
        LocalDate today = LocalDate.now();
        applyFee(invoice, today);
        invoice.setStatus(InvoiceStatus.PAID);
        invoice.setPaidDate(today);
        invoices.save(invoice);
        audit.record(userId, mallId, "INVOICE_PAID", "INVOICE", invoice.getId(), invoice.getStore().getFloor(),
                "Invoice " + label(invoice) + " marked paid (" + invoice.getAmount().add(invoice.getLateFee()) + ")");
        return view(invoice, today);
    }

    @Transactional
    public InvoiceView cancel(Long userId, Long mallId, Long invoiceId) {
        permissions.assertAccess(userId, mallId, MallPermission.MANAGE_FINANCE);
        RentInvoice invoice = invoices.findByIdAndMall_Id(invoiceId, mallId).orElseThrow(InvoiceNotFoundException::new);
        if (invoice.getStatus() != InvoiceStatus.UNPAID) {
            throw new InvoiceStateException("Only an unpaid invoice can be canceled; " + label(invoice) + " is "
                    + invoice.getStatus().name().toLowerCase());
        }
        invoice.setStatus(InvoiceStatus.CANCELED);
        invoices.save(invoice);
        audit.record(userId, mallId, "INVOICE_CANCELED", "INVOICE", invoice.getId(), invoice.getStore().getFloor(),
                "Invoice " + label(invoice) + " canceled");
        return view(invoice, LocalDate.now());
    }

    /** Adds the late fee to every unpaid invoice of the mall that is past its due date. Returns how many. */
    @Transactional
    public int refresh(Long userId, Long mallId) {
        permissions.assertAccess(userId, mallId, MallPermission.MANAGE_FINANCE);
        return applyLateFees(userId, mallId);
    }

    private int applyLateFees(Long userId, Long mallId) {
        LocalDate today = LocalDate.now();
        int changed = 0;
        for (RentInvoice invoice : invoices.findByMall_IdOrderByPeriodDescStoreCodeAsc(mallId)) {
            if (invoice.getStatus() == InvoiceStatus.UNPAID && applyFee(invoice, today)) {
                invoices.save(invoice);
                changed++;
            }
        }
        if (changed > 0) {
            audit.record(userId, mallId, "LATE_FEES_APPLIED", "INVOICE", null, null,
                    "Late fee added to " + changed + " overdue " + (changed == 1 ? "invoice" : "invoices"));
        }
        return changed;
    }

    @Transactional(readOnly = true)
    public Summary summary(Long userId, Long mallId, String period) {
        permissions.assertAccess(userId, mallId, MallPermission.VIEW_FINANCE);
        String month = period == null || period.isBlank() ? YearMonth.now().toString() : parse(period).toString();
        LocalDate today = LocalDate.now();
        List<InvoiceView> all = invoices.findByMall_IdOrderByPeriodDescStoreCodeAsc(mallId).stream()
                .map(i -> view(i, today)).toList();

        BigDecimal billed = BigDecimal.ZERO;
        BigDecimal collected = BigDecimal.ZERO;
        for (InvoiceView v : all) {
            if (v.period().equals(month) && v.status() != InvoiceStatus.CANCELED) {
                billed = billed.add(v.amount());
                if (v.status() == InvoiceStatus.PAID) {
                    collected = collected.add(v.amount());
                }
            }
        }

        BigDecimal outstanding = BigDecimal.ZERO;
        BigDecimal overdue = BigDecimal.ZERO;
        BigDecimal fees = BigDecimal.ZERO;
        Map<Long, List<InvoiceView>> unpaidByStore = new LinkedHashMap<>();
        for (InvoiceView v : all) {
            if (v.status() == InvoiceStatus.UNPAID) {
                unpaidByStore.computeIfAbsent(v.storeId(), k -> new ArrayList<>()).add(v);
                outstanding = outstanding.add(v.total());
                if (v.late()) {
                    overdue = overdue.add(v.total());
                    fees = fees.add(v.lateFee());
                }
            }
        }
        List<Debtor> debtors = new ArrayList<>();
        for (List<InvoiceView> unpaid : unpaidByStore.values()) {
            InvoiceView first = unpaid.get(0);
            BigDecimal owed = unpaid.stream().map(InvoiceView::total).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal late = unpaid.stream().filter(InvoiceView::late).map(InvoiceView::total).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal lateFees = unpaid.stream().filter(InvoiceView::late).map(InvoiceView::lateFee).reduce(BigDecimal.ZERO, BigDecimal::add);
            LocalDate oldest = unpaid.stream().map(InvoiceView::dueDate).min(Comparator.naturalOrder()).orElse(null);
            debtors.add(new Debtor(first.storeId(), first.storeCode(), first.storeName(), first.tenantName(),
                    unpaid.size(), owed, late, lateFees, oldest));
        }
        debtors.sort(Comparator.comparing(Debtor::overdue).reversed().thenComparing(Debtor::owed, Comparator.reverseOrder()));

        double rate = billed.signum() == 0 ? 0 : collected.multiply(BigDecimal.valueOf(100))
                .divide(billed, 1, RoundingMode.HALF_UP).doubleValue();
        return new Summary(month, billed, collected, rate, outstanding, overdue, fees, debtors);
    }

    // ------------------------------------------------------------------ helpers

    private InvoiceView view(RentInvoice i, LocalDate today) {
        boolean late = i.getStatus() == InvoiceStatus.UNPAID && today.isAfter(i.getDueDate());
        BigDecimal fee = i.getLateFee() != null && i.getLateFee().signum() > 0 ? i.getLateFee()
                : late ? feeFor(i) : BigDecimal.ZERO;
        return new InvoiceView(i.getId(), i.getStore().getId(), i.getStoreCode(), i.getStoreName(), i.getTenantName(),
                i.getPeriod(), i.getAmount(), fee, i.getAmount().add(fee), i.getDueDate(), i.getStatus(), late,
                late ? ChronoUnit.DAYS.between(i.getDueDate(), today) : 0, i.getPaidDate());
    }

    /** Stores the late fee when the invoice is overdue and does not carry it yet. */
    private boolean applyFee(RentInvoice invoice, LocalDate today) {
        if (today.isAfter(invoice.getDueDate()) && invoice.getLateFee().signum() == 0) {
            invoice.setLateFee(feeFor(invoice));
            return invoice.getLateFee().signum() > 0;
        }
        return false;
    }

    private BigDecimal feeFor(RentInvoice invoice) {
        return invoice.getAmount().multiply(lateFeePercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    private static String label(RentInvoice i) {
        return i.getStoreCode() + " " + i.getPeriod();
    }

    private static YearMonth parse(String period) {
        if (period == null || period.isBlank()) {
            return YearMonth.now();
        }
        try {
            return YearMonth.parse(period.trim());
        } catch (DateTimeParseException e) {
            throw new InvalidMallOperationException("period must look like 2026-10");
        }
    }
}
