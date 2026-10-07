package com.mmea.mallos.mall.service;

import com.mmea.mallos.mall.model.enums.MallPermission;

public interface PermissionService {
    void assertAccess(Long userId, Long mallId, MallPermission permission);
    void assertManager(Long userId, Long mallId);

    /**
     * The caller may run the team: a super admin or the manager (returns null: no limits), or an assistant holding
     * MANAGE_EMPLOYEES (returns their membership: they act within their own permissions).
     */
    com.mmea.mallos.mall.model.MallMember assertTeamManager(Long userId, Long mallId);
}
