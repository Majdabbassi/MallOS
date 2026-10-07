package com.mmea.mallos.analytics;

import com.mmea.mallos.config.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Downloads: the units and leases report, and the invoices (needs EDIT_REPORTS, plus VIEW_FINANCE for invoices). */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/malls/{mallId}/reports")
public class ReportExportController {

    private static final MediaType CSV = MediaType.parseMediaType("text/csv;charset=UTF-8");

    private final ReportExportService exports;
    private final CurrentUserService currentUser;

    @GetMapping("/units.csv")
    public ResponseEntity<String> units(@PathVariable Long mallId) {
        return file("units-and-leases.csv", exports.unitsCsv(currentUser.getCurrentUserId(), mallId));
    }

    @GetMapping("/invoices.csv")
    public ResponseEntity<String> invoices(@PathVariable Long mallId, @RequestParam(required = false) String period) {
        String name = period == null || period.isBlank() ? "invoices.csv" : "invoices-" + period + ".csv";
        return file(name, exports.invoicesCsv(currentUser.getCurrentUserId(), mallId, period));
    }

    private static ResponseEntity<String> file(String name, String body) {
        return ResponseEntity.ok()
                .contentType(CSV)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + name + "\"")
                .body(body);
    }
}
