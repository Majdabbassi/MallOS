package com.mmea.mallos.mall.dto;

import com.mmea.mallos.mall.model.enums.StoreCategory;
import com.mmea.mallos.mall.model.enums.StoreStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class UpdateStoreRequest {
    private String name;
    private String code;
    private StoreCategory category;
    private Integer floor;
    private String zone;
    private Double surface;
    private StoreStatus status;
    private String ownerName;
    private String ownerPhone;
    private String ownerEmail;
    private LocalDate contractStart;
    private LocalDate contractEnd;
    private BigDecimal monthlyRent;
    private String description;
}
