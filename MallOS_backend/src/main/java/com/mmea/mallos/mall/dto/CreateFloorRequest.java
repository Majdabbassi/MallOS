package com.mmea.mallos.mall.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateFloorRequest {

    @NotBlank(message = "Floor name is required")
    private String name;

    @Min(value = 0, message = "Level must be 0 or greater")
    private int level;
}
