package com.mmea.mallos.maintenance;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class WorkOrderDtos {

    private WorkOrderDtos() {
    }

    /** Create or edit: the store is optional; the status changes through its own endpoint. */
    public record WorkOrderRequest(String title, String description, WorkOrder.Priority priority, Long storeId,
                                   String assignee) {
    }

    public record StatusChange(WorkOrder.Status status, BigDecimal cost) {
    }

    public record WorkOrderView(Long id, String title, String description, WorkOrder.Priority priority,
                                WorkOrder.Status status, Long storeId, String storeCode, String storeName,
                                Integer floor, String assignee, BigDecimal cost, String reportedBy,
                                LocalDateTime createdAt, LocalDateTime updatedAt, LocalDateTime closedAt) {

        static WorkOrderView of(WorkOrder w) {
            return new WorkOrderView(w.getId(), w.getTitle(), w.getDescription(), w.getPriority(), w.getStatus(),
                    w.getStore() == null ? null : w.getStore().getId(),
                    w.getStore() == null ? null : w.getStore().getCode(),
                    w.getStore() == null ? null : w.getStore().getName(),
                    w.getStore() == null ? null : w.getStore().getFloor(),
                    w.getAssignee(), w.getCost(), w.getReportedByName(), w.getCreatedAt(), w.getUpdatedAt(),
                    w.getClosedAt());
        }
    }
}
