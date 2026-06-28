package com.mmea.mallos.mall.dto;

import com.mmea.mallos.mall.model.enums.MallPermission;
import lombok.Data;

import java.util.Set;

@Data
public class UpdatePermissionsRequest {
    private Set<MallPermission> permissions;
}
