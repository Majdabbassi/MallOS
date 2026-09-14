package com.mmea.mallos.mall.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LinkStoreRequest {

    @NotNull(message = "storeId is required")
    private Long storeId;
}
