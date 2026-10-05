package com.mmea.mallos.mall.dto;

import com.mmea.mallos.mall.model.enums.StoreCategory;
import com.mmea.mallos.mall.model.enums.StoreStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateStoreRequest {

    @NotBlank(message = "Store name is required")
    private String name;

    @NotBlank(message = "Store code is required")
    private String code;

    @NotNull(message = "Category is required")
    private StoreCategory category;

    private int floor;

    private String zone;

    private Double surface;

    @NotNull(message = "Status is required")
    private StoreStatus status;

    private String ownerName;
    private String ownerPhone;
    private String ownerEmail;
    private LocalDate contractStart;
    private LocalDate contractEnd;
    private BigDecimal monthlyRent;
    private String description;
}
