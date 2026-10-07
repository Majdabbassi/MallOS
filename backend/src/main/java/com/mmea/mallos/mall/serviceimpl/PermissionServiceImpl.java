package com.mmea.mallos.mall.serviceimpl;

import com.mmea.mallos.mall.exception.MallAccessDeniedException;
import com.mmea.mallos.mall.model.MallMember;
import com.mmea.mallos.mall.model.enums.MallPermission;
import com.mmea.mallos.mall.model.enums.MallMemberRole;
import com.mmea.mallos.mall.repository.MallMemberRepository;
import com.mmea.mallos.mall.service.PermissionService;
import com.mmea.mallos.user.model.User;
import com.mmea.mallos.user.model.enums.Role;
import com.mmea.mallos.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PermissionServiceImpl implements PermissionService {

    private final MallMemberRepository mallMemberRepository;
    private final UserRepository userRepository;

    @Override
    public void assertAccess(Long userId, Long mallId, MallPermission permission) {
        // Platform administrators are not mall members, but they own the
        // platform: they have full read/write access to every mall.
        User user = userRepository.findById(userId).orElseThrow(MallAccessDeniedException::new);
        if (user.getRole() == Role.SUPER_ADMIN) return;

        MallMember member = mallMemberRepository.findActiveByUserAndMall(userId, mallId);
        if (member == null) throw new MallAccessDeniedException();

        if (permission == null) return; // any active member can view

        if (member.getRole() == MallMemberRole.MANAGER) return; // manager has full access

        if (member.getRole() == MallMemberRole.ASSISTANT) {
            if (member.getPermissions() == null || !member.getPermissions().contains(permission))
                throw new MallAccessDeniedException();
            return;
        }

        throw new MallAccessDeniedException();
    }

    @Override
    public MallMember assertTeamManager(Long userId, Long mallId) {
        User user = userRepository.findById(userId).orElseThrow(MallAccessDeniedException::new);
        if (user.getRole() == Role.SUPER_ADMIN) return null;
        MallMember member = mallMemberRepository.findActiveByUserAndMall(userId, mallId);
        if (member == null) throw new MallAccessDeniedException();
        if (member.getRole() == MallMemberRole.MANAGER) return null;
        if (member.getPermissions() != null && member.getPermissions().contains(MallPermission.MANAGE_EMPLOYEES)) return member;
        throw new MallAccessDeniedException();
    }

    @Override
    public void assertManager(Long userId, Long mallId) {
        User user = userRepository.findById(userId).orElseThrow(MallAccessDeniedException::new);
        if (user.getRole() == Role.SUPER_ADMIN) return;

        MallMember member = mallMemberRepository.findActiveByUserAndMall(userId, mallId);
        if (member == null || member.getRole() != MallMemberRole.MANAGER)
            throw new MallAccessDeniedException();
    }
}
