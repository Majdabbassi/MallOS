package com.mmea.mallos.mall.dto;

import com.mmea.mallos.mall.model.enums.StoreCategory;
import com.mmea.mallos.mall.model.enums.StoreStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreResponse {
    private Long id;
    private Long mallId;
    private String name;
    private String code;
    private StoreCategory category;
    private int floor;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
