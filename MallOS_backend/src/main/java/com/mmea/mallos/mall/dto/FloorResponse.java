package com.mmea.mallos.mall.dto;

import com.mmea.mallos.mall.model.enums.FloorStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FloorResponse {
    private Long id;
    private Long mallId;
    private String name;
    private int level;
    private String sourceImageUrl;
    private int width;
    private int height;
    private FloorStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
