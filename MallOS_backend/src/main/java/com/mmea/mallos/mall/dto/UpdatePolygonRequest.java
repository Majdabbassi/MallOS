package com.mmea.mallos.mall.dto;

import com.mmea.mallos.mall.model.enums.PolygonType;
import lombok.Data;

import java.util.List;

@Data
public class UpdatePolygonRequest {
    private List<PointDto> points;
    private String label;
    private PolygonType polygonType;
}
