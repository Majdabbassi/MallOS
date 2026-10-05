package com.mmea.mallos.mall.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeometryResponse {
    private FloorResponse floor;
    private List<PolygonResponse> polygons;
}
