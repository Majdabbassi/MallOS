package com.mmea.mallos.analytics;

import com.mmea.mallos.config.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/malls/{mallId}/analytics")
public class AnalyticsController {

    private final AnalyticsService service;
    private final CurrentUserService currentUser;

    /** Occupancy, rent per m2, lease expiry and the state of every unit (needs VIEW_REPORTS). */
    @GetMapping
    public ResponseEntity<MallAnalytics> analytics(@PathVariable Long mallId) {
        return ResponseEntity.ok(service.analyze(currentUser.getCurrentUserId(), mallId));
    }
}
