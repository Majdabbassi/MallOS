package com.mmea.mallos.mall.dto;

import com.mmea.mallos.mall.model.enums.PolygonType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolygonResponse {
    private Long id;
    private Long floorId;
    private List<PointDto> points;
    private String label;
    private PolygonType polygonType;

    /** Populated when a Slot links this polygon to a Store; null otherwise. */
    private StoreDto store;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
