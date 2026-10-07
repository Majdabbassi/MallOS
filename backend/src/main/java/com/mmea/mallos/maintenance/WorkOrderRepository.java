package com.mmea.mallos.maintenance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {

    List<WorkOrder> findByMall_IdOrderByCreatedAtDesc(Long mallId);

    List<WorkOrder> findByMall_IdAndStatusOrderByCreatedAtDesc(Long mallId, WorkOrder.Status status);

    Optional<WorkOrder> findByIdAndMall_Id(Long id, Long mallId);
}
