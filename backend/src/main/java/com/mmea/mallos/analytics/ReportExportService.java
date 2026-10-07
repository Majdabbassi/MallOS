package com.mmea.mallos.analytics;

import com.mmea.mallos.audit.AuditService;
import com.mmea.mallos.finance.InvoiceDtos.InvoiceView;
import com.mmea.mallos.finance.InvoiceService;
import com.mmea.mallos.mall.model.enums.MallPermission;
import com.mmea.mallos.mall.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * CSV exports of the mall's reports, for whoever holds EDIT_REPORTS ("Export reports"). The invoice export also needs
 * VIEW_FINANCE, like the finance screen. Every export is written to the audit trail: it hands tenant data out.
 */
@Service
@RequiredArgsConstructor
public class ReportExportService {

    private final AnalyticsService analytics;
    private final InvoiceService invoices;
    private final PermissionService permissions;
    private final AuditService audit;

    @Transactional
    public String unitsCsv(Long userId, Long mallId) {
        permissions.assertAccess(userId, mallId, MallPermission.EDIT_REPORTS);
        MallAnalytics report = analytics.compute(mallId);
        StringBuilder csv = new StringBuilder(
                "code,name,floor,category,status,surface_m2,monthly_rent,tenant,lease_end,days_left,lease_state\n");
        for (MallAnalytics.Unit u : report.units()) {
            row(csv, u.code(), u.name(), u.floor(), u.category(), u.status(), u.surface(), u.monthlyRent(), u.tenant(),
                    u.contractEnd(), u.daysLeft(), u.leaseState());
        }
        audit.record(userId, mallId, "REPORT_EXPORTED", "REPORT", null, null,
                "Exported the units and leases report (" + report.units().size() + " units)");
        return csv.toString();
    }

    @Transactional
    public String invoicesCsv(Long userId, Long mallId, String period) {
        permissions.assertAccess(userId, mallId, MallPermission.EDIT_REPORTS);
        List<InvoiceView> rows = invoices.list(userId, mallId, period, null); // checks VIEW_FINANCE
        StringBuilder csv = new StringBuilder(
                "period,store_code,store,tenant,amount,late_fee,total,due_date,status,days_late,paid_date\n");
        for (InvoiceView i : rows) {
            row(csv, i.period(), i.storeCode(), i.storeName(), i.tenantName(), i.amount(), i.lateFee(), i.total(),
                    i.dueDate(), i.status(), i.daysLate(), i.paidDate());
        }
        audit.record(userId, mallId, "REPORT_EXPORTED", "REPORT", null, null,
                "Exported " + rows.size() + " invoices" + (period == null || period.isBlank() ? "" : " for " + period));
        return csv.toString();
    }

    private static void row(StringBuilder csv, Object... values) {
        for (int i = 0; i < values.length; i++) {
            if (i > 0) csv.append(',');
            csv.append(cell(values[i]));
        }
        csv.append('\n');
    }

    /**
     * One CSV cell: quoted when needed, and a text that a spreadsheet would run as a formula (=, +, -, @ first) is
     * prefixed with an apostrophe, because tenant and store names are typed by users.
     */
    static String cell(Object value) {
        if (value == null) return "";
        String text = value.toString();
        if (!(value instanceof Number) && !text.isEmpty() && "=+-@\t\r".indexOf(text.charAt(0)) >= 0) {
            text = "'" + text;
        }
        if (text.contains(",") || text.contains("\"") || text.contains("\n") || text.contains("\r")) {
            text = "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
    }
}
