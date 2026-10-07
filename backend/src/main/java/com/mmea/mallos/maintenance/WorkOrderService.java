package com.mmea.mallos.maintenance;

import com.mmea.mallos.audit.AuditService;
import com.mmea.mallos.maintenance.WorkOrderDtos.StatusChange;
import com.mmea.mallos.maintenance.WorkOrderDtos.WorkOrderRequest;
import com.mmea.mallos.maintenance.WorkOrderDtos.WorkOrderView;
import com.mmea.mallos.mall.exception.InvalidMallOperationException;
import com.mmea.mallos.mall.exception.MallNotFoundException;
import com.mmea.mallos.mall.exception.StoreNotFoundException;
import com.mmea.mallos.mall.model.Mall;
import com.mmea.mallos.mall.model.Store;
import com.mmea.mallos.mall.model.enums.MallPermission;
import com.mmea.mallos.mall.repository.MallRepository;
import com.mmea.mallos.mall.repository.StoreRepository;
import com.mmea.mallos.mall.service.PermissionService;
import com.mmea.mallos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Maintenance work orders, for managers and assistants holding MANAGE_ORDERS.
 *
 * <p>Life cycle: OPEN -> IN_PROGRESS -> DONE, with CANCELED possible until the job is done, and IN_PROGRESS -> OPEN
 * when it has to wait. DONE and CANCELED are final. Every step is written to the audit trail in the same transaction.
 */
@Service
@RequiredArgsConstructor
public class WorkOrderService {

    private static final Map<WorkOrder.Status, Set<WorkOrder.Status>> NEXT = Map.of(
            WorkOrder.Status.OPEN, EnumSet.of(WorkOrder.Status.IN_PROGRESS, WorkOrder.Status.DONE, WorkOrder.Status.CANCELED),
            WorkOrder.Status.IN_PROGRESS, EnumSet.of(WorkOrder.Status.OPEN, WorkOrder.Status.DONE, WorkOrder.Status.CANCELED),
            WorkOrder.Status.DONE, EnumSet.noneOf(WorkOrder.Status.class),
            WorkOrder.Status.CANCELED, EnumSet.noneOf(WorkOrder.Status.class));

    /** Open work first (most urgent on top), then the history, newest first. */
    private static final Comparator<WorkOrder> BOARD_ORDER = Comparator
            .comparing((WorkOrder w) -> isClosed(w.getStatus()))
            .thenComparing(w -> w.getPriority().ordinal(), Comparator.reverseOrder())
            .thenComparing(WorkOrder::getCreatedAt, Comparator.reverseOrder());

    private final WorkOrderRepository orders;
    private final MallRepository malls;
    private final StoreRepository stores;
    private final UserRepository users;
    private final PermissionService permissions;
    private final AuditService audit;

    @Transactional(readOnly = true)
    public List<WorkOrderView> list(Long userId, Long mallId, WorkOrder.Status status) {
        permissions.assertAccess(userId, mallId, MallPermission.MANAGE_ORDERS);
        List<WorkOrder> rows = status == null
                ? orders.findByMall_IdOrderByCreatedAtDesc(mallId)
                : orders.findByMall_IdAndStatusOrderByCreatedAtDesc(mallId, status);
        return rows.stream().sorted(BOARD_ORDER).map(WorkOrderView::of).toList();
    }

    @Transactional
    public WorkOrderView create(Long userId, Long mallId, WorkOrderRequest request) {
        permissions.assertAccess(userId, mallId, MallPermission.MANAGE_ORDERS);
        Mall mall = malls.findById(mallId).orElseThrow(MallNotFoundException::new);
        LocalDateTime now = LocalDateTime.now();
        WorkOrder order = WorkOrder.builder()
                .mall(mall)
                .status(WorkOrder.Status.OPEN)
                .reportedById(userId)
                .reportedByName(users.findById(userId).map(u -> u.getUsername()).orElse(null))
                .createdAt(now)
                .updatedAt(now)
                .build();
        apply(order, request, mallId);
        WorkOrder saved = orders.save(order);
        audit.record(userId, mallId, "WORK_ORDER_OPENED", "WORK_ORDER", saved.getId(), floorOf(saved),
                "Work order #" + saved.getId() + " opened: " + saved.getTitle() + where(saved) + " (" + saved.getPriority() + ")");
        return WorkOrderView.of(saved);
    }

    @Transactional
    public WorkOrderView update(Long userId, Long mallId, Long id, WorkOrderRequest request) {
        permissions.assertAccess(userId, mallId, MallPermission.MANAGE_ORDERS);
        WorkOrder order = find(mallId, id);
        if (isClosed(order.getStatus())) {
            throw new WorkOrderStateException("Work order #" + id + " is " + order.getStatus() + " and can no longer be edited");
        }
        apply(order, request, mallId);
        order.setUpdatedAt(LocalDateTime.now());
        audit.record(userId, mallId, "WORK_ORDER_EDITED", "WORK_ORDER", id, floorOf(order),
                "Work order #" + id + " edited: " + order.getTitle() + where(order));
        return WorkOrderView.of(order);
    }

    @Transactional
    public WorkOrderView changeStatus(Long userId, Long mallId, Long id, StatusChange change) {
        permissions.assertAccess(userId, mallId, MallPermission.MANAGE_ORDERS);
        if (change == null || change.status() == null) {
            throw new InvalidMallOperationException("status is required");
        }
        WorkOrder order = find(mallId, id);
        WorkOrder.Status from = order.getStatus();
        if (!NEXT.get(from).contains(change.status())) {
            throw new WorkOrderStateException("A work order cannot go from " + from + " to " + change.status());
        }
        if (change.cost() != null) {
            if (change.cost().compareTo(BigDecimal.ZERO) < 0) {
                throw new InvalidMallOperationException("cost cannot be negative");
            }
            order.setCost(change.cost());
        }
        LocalDateTime now = LocalDateTime.now();
        order.setStatus(change.status());
        order.setUpdatedAt(now);
        if (isClosed(change.status())) {
            order.setClosedAt(now);
        }
        audit.record(userId, mallId, "WORK_ORDER_" + change.status().name(), "WORK_ORDER", id, floorOf(order),
                "Work order #" + id + " " + from + " -> " + change.status() + ": " + order.getTitle()
                        + (order.getCost() != null && change.status() == WorkOrder.Status.DONE ? " (cost " + order.getCost() + ")" : ""));
        return WorkOrderView.of(order);
    }

    private WorkOrder find(Long mallId, Long id) {
        // the mall id is part of the lookup: an order of another mall answers 404, even with the right id
        return orders.findByIdAndMall_Id(id, mallId).orElseThrow(WorkOrderNotFoundException::new);
    }

    private void apply(WorkOrder order, WorkOrderRequest request, Long mallId) {
        if (request == null || request.title() == null || request.title().isBlank()) {
            throw new InvalidMallOperationException("title is required");
        }
        if (request.title().length() > 160 || (request.description() != null && request.description().length() > 2000)
                || (request.assignee() != null && request.assignee().length() > 160)) {
            throw new InvalidMallOperationException("title and assignee: 160 characters at most, description: 2000");
        }
        Store store = null;
        if (request.storeId() != null) {
            store = stores.findByIdAndMall_Id(request.storeId(), mallId).orElseThrow(StoreNotFoundException::new);
        }
        order.setTitle(request.title().trim());
        order.setDescription(request.description());
        order.setPriority(request.priority() == null ? WorkOrder.Priority.NORMAL : request.priority());
        order.setStore(store);
        order.setAssignee(request.assignee() == null || request.assignee().isBlank() ? null : request.assignee().trim());
    }

    private static boolean isClosed(WorkOrder.Status status) {
        return status == WorkOrder.Status.DONE || status == WorkOrder.Status.CANCELED;
    }

    private static Integer floorOf(WorkOrder order) {
        return order.getStore() == null ? null : order.getStore().getFloor();
    }

    private static String where(WorkOrder order) {
        return order.getStore() == null ? "" : " in " + order.getStore().getCode();
    }
}
