package com.mmea.mallos.audit;

import com.mmea.mallos.config.security.CurrentUserService;
import com.mmea.mallos.mall.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/malls/{mallId}/audit")
public class AuditController {

    private final AuditService audit;
    private final PermissionService permissions;
    private final CurrentUserService currentUser;

    /**
     * The mall's history, newest first. Managers (and platform administrators) only: it names who did what.
     * Optional filters: {@code actor} (part of a username), {@code floor} (level), {@code entityType}, {@code action}
     * (prefix, e.g. INVOICE).
     */
    @GetMapping
    public ResponseEntity<List<AuditEntry>> history(@PathVariable Long mallId,
                                                    @RequestParam(required = false) String actor,
                                                    @RequestParam(required = false) Integer floor,
                                                    @RequestParam(required = false) String entityType,
                                                    @RequestParam(required = false) String action,
                                                    @RequestParam(defaultValue = "50") int limit) {
        permissions.assertManager(currentUser.getCurrentUserId(), mallId);
        return ResponseEntity.ok(audit.history(mallId, actor, floor, entityType, action, limit));
    }
}
