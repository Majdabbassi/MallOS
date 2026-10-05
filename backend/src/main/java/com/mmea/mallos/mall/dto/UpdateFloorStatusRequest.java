package com.mmea.mallos.mall.dto;

import com.mmea.mallos.mall.model.enums.FloorStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateFloorStatusRequest {

    @NotNull(message = "Status is required")
    private FloorStatus status;
}
