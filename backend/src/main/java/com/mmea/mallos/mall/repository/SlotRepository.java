package com.mmea.mallos.mall.repository;

import com.mmea.mallos.mall.model.Slot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SlotRepository extends JpaRepository<Slot, Long> {

    Optional<Slot> findByPolygon_Id(Long polygonId);

    Optional<Slot> findByStore_Id(Long storeId);

    List<Slot> findByFloor_Id(Long floorId);
}
