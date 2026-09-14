package com.mmea.mallos.mall.dto;

import com.mmea.mallos.mall.model.enums.PolygonType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreatePolygonRequest {

    @NotEmpty(message = "Points array must not be empty")
    @Valid
    private List<PointDto> points;

    private String label;

    @NotNull(message = "Polygon type is required")
    private PolygonType polygonType;
}
