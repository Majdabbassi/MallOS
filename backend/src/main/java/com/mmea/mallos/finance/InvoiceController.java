package com.mmea.mallos.finance;

import com.mmea.mallos.config.security.CurrentUserService;
import com.mmea.mallos.finance.InvoiceDtos.Generated;
import com.mmea.mallos.finance.InvoiceDtos.InvoiceView;
import com.mmea.mallos.finance.InvoiceDtos.Summary;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Rent invoices of a mall. Viewing needs VIEW_FINANCE, changing anything needs MANAGE_FINANCE (managers have both). */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/malls/{mallId}")
public class InvoiceController {

    private final InvoiceService service;
    private final CurrentUserService currentUser;

    @GetMapping("/invoices")
    public ResponseEntity<List<InvoiceView>> list(@PathVariable Long mallId,
                                                  @RequestParam(required = false) String period,
                                                  @RequestParam(required = false) String state) {
        return ResponseEntity.ok(service.list(currentUser.getCurrentUserId(), mallId, period, state));
    }

    /** Bills the month ({@code period=2026-10}, default the current one) for every store that is billable. */
    @PostMapping("/invoices/generate")
    public ResponseEntity<Generated> generate(@PathVariable Long mallId, @RequestParam(required = false) String period) {
        return ResponseEntity.ok(service.generate(currentUser.getCurrentUserId(), mallId, period));
    }

    @PostMapping("/invoices/refresh")
    public ResponseEntity<Map<String, Integer>> refresh(@PathVariable Long mallId) {
        return ResponseEntity.ok(Map.of("lateFeesApplied", service.refresh(currentUser.getCurrentUserId(), mallId)));
    }

    @PostMapping("/invoices/{invoiceId}/pay")
    public ResponseEntity<InvoiceView> pay(@PathVariable Long mallId, @PathVariable Long invoiceId) {
        return ResponseEntity.ok(service.pay(currentUser.getCurrentUserId(), mallId, invoiceId));
    }

    @PostMapping("/invoices/{invoiceId}/cancel")
    public ResponseEntity<InvoiceView> cancel(@PathVariable Long mallId, @PathVariable Long invoiceId) {
        return ResponseEntity.ok(service.cancel(currentUser.getCurrentUserId(), mallId, invoiceId));
    }

    /** Collected and outstanding money, and who owes what. */
    @GetMapping("/finance/summary")
    public ResponseEntity<Summary> summary(@PathVariable Long mallId, @RequestParam(required = false) String period) {
        return ResponseEntity.ok(service.summary(currentUser.getCurrentUserId(), mallId, period));
    }
}
