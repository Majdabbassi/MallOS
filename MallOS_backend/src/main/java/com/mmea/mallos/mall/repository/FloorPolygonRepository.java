package com.mmea.mallos.mall.repository;

import com.mmea.mallos.mall.model.FloorPolygon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FloorPolygonRepository extends JpaRepository<FloorPolygon, Long> {

    List<FloorPolygon> findByFloor_IdOrderByCreatedAtAsc(Long floorId);

    Optional<FloorPolygon> findByIdAndFloor_Id(Long polygonId, Long floorId);

    void deleteByFloor_Id(Long floorId);
}
