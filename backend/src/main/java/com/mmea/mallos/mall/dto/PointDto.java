package com.mmea.mallos.mall.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
/** A point of a polygon, as a fraction of the floor image: 0 is the left/top edge, 1 the right/bottom edge. */
public class PointDto {
    @jakarta.validation.constraints.DecimalMin(value = "0.0", message = "x must be between 0 and 1")
    @jakarta.validation.constraints.DecimalMax(value = "1.0", message = "x must be between 0 and 1")
    private double x;

    @jakarta.validation.constraints.DecimalMin(value = "0.0", message = "y must be between 0 and 1")
    @jakarta.validation.constraints.DecimalMax(value = "1.0", message = "y must be between 0 and 1")
    private double y;
}
