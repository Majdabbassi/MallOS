package com.mmea.mallos.mall.dto;

import lombok.Data;

/** Phase 2 stub — options passed to GeometryExtractionService. */
@Data
public class ExtractionOptions {
    private double confidenceThreshold = 0.8;
    private boolean detectCorridors = true;
}
