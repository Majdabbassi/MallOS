package com.mmea.mallos.mall.service;

import com.mmea.mallos.mall.model.enums.MallPermission;

public interface PermissionService {
    void assertAccess(Long userId, Long mallId, MallPermission permission);
    void assertManager(Long userId, Long mallId);
}
