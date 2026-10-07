package com.mmea.mallos.maintenance;

import com.mmea.mallos.config.security.CurrentUserService;
import com.mmea.mallos.maintenance.WorkOrderDtos.StatusChange;
import com.mmea.mallos.maintenance.WorkOrderDtos.WorkOrderRequest;
import com.mmea.mallos.maintenance.WorkOrderDtos.WorkOrderView;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Maintenance work orders of one mall (needs MANAGE_ORDERS). There is no delete: cancel instead. */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/malls/{mallId}/work-orders")
public class WorkOrderController {

    private final WorkOrderService service;
    private final CurrentUserService currentUser;

    @GetMapping
    public ResponseEntity<List<WorkOrderView>> list(@PathVariable Long mallId,
                                                    @RequestParam(required = false) WorkOrder.Status status) {
        return ResponseEntity.ok(service.list(currentUser.getCurrentUserId(), mallId, status));
    }

    @PostMapping
    public ResponseEntity<WorkOrderView> create(@PathVariable Long mallId, @RequestBody WorkOrderRequest request) {
        return ResponseEntity.ok(service.create(currentUser.getCurrentUserId(), mallId, request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkOrderView> update(@PathVariable Long mallId, @PathVariable Long id,
                                                @RequestBody WorkOrderRequest request) {
        return ResponseEntity.ok(service.update(currentUser.getCurrentUserId(), mallId, id, request));
    }

    @PostMapping("/{id}/status")
    public ResponseEntity<WorkOrderView> status(@PathVariable Long mallId, @PathVariable Long id,
                                                @RequestBody StatusChange change) {
        return ResponseEntity.ok(service.changeStatus(currentUser.getCurrentUserId(), mallId, id, change));
    }
}
