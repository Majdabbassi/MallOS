package com.mmea.mallos.mall.service;

import com.mmea.mallos.mall.dto.InviteAssistantRequest;
import com.mmea.mallos.mall.model.MallMember;

import java.util.Set;
import com.mmea.mallos.mall.model.enums.MallPermission;

public interface MallMemberService {
    MallMember assignManager(Long adminId, Long mallId, Long userId);
    MallMember inviteAssistant(Long managerId, Long mallId, InviteAssistantRequest request);
    MallMember updatePermissions(Long managerId, Long mallId, Long targetUserId, Set<MallPermission> permissions);
    void deactivateAssistant(Long managerId, Long mallId, Long targetUserId);
}
