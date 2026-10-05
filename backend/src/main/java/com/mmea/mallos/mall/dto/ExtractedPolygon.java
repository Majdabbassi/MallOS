package com.mmea.mallos.mall.dto;

import lombok.Data;

/** Phase 2 stub — represents a polygon extracted automatically by GeometryExtractionService. */
@Data
public class ExtractedPolygon {
    private java.util.List<PointDto> points;
    private String suggestedLabel;
}
