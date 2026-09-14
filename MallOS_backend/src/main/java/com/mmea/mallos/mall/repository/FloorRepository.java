package com.mmea.mallos.mall.repository;

import com.mmea.mallos.mall.model.Floor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FloorRepository extends JpaRepository<Floor, Long> {

    List<Floor> findByMall_IdOrderByLevelAsc(Long mallId);

    Optional<Floor> findByIdAndMall_Id(Long floorId, Long mallId);
}
