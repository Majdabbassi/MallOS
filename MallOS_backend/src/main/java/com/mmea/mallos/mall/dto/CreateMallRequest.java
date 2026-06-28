package com.mmea.mallos.mall.dto;

import lombok.Data;

@Data
public class CreateMallRequest {
    private String name;
    private String companyName;
    private String address;
    private String taxId;
}
