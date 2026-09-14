package com.mmea.mallos.mall.service;

import com.mmea.mallos.mall.dto.ExtractedPolygon;
import com.mmea.mallos.mall.dto.ExtractionOptions;

import java.util.List;

/**
 * Phase 2 placeholder — auto-extraction of polygons from a floor plan image.
 * Not called or implemented in Phase 1. A Phase 2 implementation (OpenCV / Vision AI)
 * would implement this interface and be injected into FloorplanServiceImpl to
 * pre-populate draft polygons, without touching the data model or APIs.
 */
public interface GeometryExtractionService {
    List<ExtractedPolygon> extract(byte[] imageBytes, ExtractionOptions options);
}
