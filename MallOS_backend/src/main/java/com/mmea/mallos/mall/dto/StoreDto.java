package com.mmea.mallos.mall.dto;

import com.mmea.mallos.mall.model.enums.StoreCategory;
import com.mmea.mallos.mall.model.enums.StoreStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreDto {
    private Long id;
    private String name;
    private String code;
    private StoreCategory category;
    private StoreStatus status;
    private String ownerName;
    private Double surface;
    private java.math.BigDecimal monthlyRent;
}
