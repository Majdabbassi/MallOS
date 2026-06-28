package com.mmea.mallos.mall.serviceimpl;

import com.mmea.mallos.mall.dto.InviteAssistantRequest;
import com.mmea.mallos.mall.exception.InvalidMallOperationException;
import com.mmea.mallos.mall.exception.MallNotFoundException;
import com.mmea.mallos.mall.exception.UserAlreadyMemberException;
import com.mmea.mallos.mall.model.Mall;
import com.mmea.mallos.mall.model.MallMember;
import com.mmea.mallos.mall.model.enums.MallMemberRole;
import com.mmea.mallos.mall.model.enums.MallPermission;
import com.mmea.mallos.mall.repository.MallMemberRepository;
import com.mmea.mallos.mall.repository.MallRepository;
import com.mmea.mallos.mall.service.MallMemberService;
import com.mmea.mallos.mall.service.PermissionService;
import com.mmea.mallos.user.model.User;
import com.mmea.mallos.user.model.enums.Role;
import com.mmea.mallos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class MallMemberServiceImpl implements MallMemberService {

    private final UserRepository userRepository;
    private final MallRepository mallRepository;
    private final MallMemberRepository mallMemberRepository;
    private final PermissionService permissionService;

    @Override
    public MallMember assignManager(Long adminId, Long mallId, Long userId) {
        User admin = userRepository.findById(adminId).orElseThrow(() -> new InvalidMallOperationException("Admin not found"));
        if (admin.getRole() != Role.SUPER_ADMIN) throw new InvalidMallOperationException("Only SUPER_ADMIN can assign managers");

        Mall mall = mallRepository.findById(mallId).orElseThrow(MallNotFoundException::new);
        User user = userRepository.findById(userId).orElseThrow(() -> new InvalidMallOperationException("User not found"));

        if (user.getRole() != Role.MALL_USER) throw new InvalidMallOperationException("Target user must be MALL_USER");

        MallMember existing = mallMemberRepository.findActiveByUserAndMall(userId, mallId);
        if (existing != null) throw new UserAlreadyMemberException();

        MallMember member = MallMember.builder()
                .mall(mall)
                .user(user)
                .role(MallMemberRole.MANAGER)
                .permissions(null)
                .invitedBy(admin)
                .isActive(true)
                .build();

        return mallMemberRepository.save(member);
    }

    @Override
    public MallMember inviteAssistant(Long managerId, Long mallId, InviteAssistantRequest request) {
        permissionService.assertManager(managerId, mallId);

        Mall mall = mallRepository.findById(mallId).orElseThrow(MallNotFoundException::new);

        User user = userRepository.findByEmail(request.getEmailOrUsername()).orElse(null);
        if (user == null) user = userRepository.findByUsername(request.getEmailOrUsername()).orElse(null);
        if (user == null) throw new InvalidMallOperationException("User not found");

        if (user.getRole() != Role.MALL_USER) throw new InvalidMallOperationException("Target user must be MALL_USER");

        MallMember existing = mallMemberRepository.findActiveByUserAndMall(user.getId(), mallId);
        if (existing != null) throw new UserAlreadyMemberException();

        Set<MallPermission> perms = request.getPermissions();
        if (perms == null || perms.isEmpty()) throw new InvalidMallOperationException("Assistant must have at least one permission");

        User inviter = userRepository.findById(managerId).orElseThrow(() -> new InvalidMallOperationException("Manager not found"));

        MallMember member = MallMember.builder()
                .mall(mall)
                .user(user)
                .role(MallMemberRole.ASSISTANT)
                .permissions(perms)
                .invitedBy(inviter)
                .isActive(true)
                .build();

        return mallMemberRepository.save(member);
    }

    @Override
    public MallMember updatePermissions(Long managerId, Long mallId, Long targetUserId, Set<MallPermission> permissions) {
        permissionService.assertManager(managerId, mallId);

        MallMember target = mallMemberRepository.findActiveByUserAndMall(targetUserId, mallId);
        if (target == null) throw new InvalidMallOperationException("Target is not an active member");
        if (target.getRole() != MallMemberRole.ASSISTANT) throw new InvalidMallOperationException("Cannot update permissions of a MANAGER");

        Set<MallPermission> perms = permissions;
        if (perms == null || perms.isEmpty()) throw new InvalidMallOperationException("Permissions set cannot be empty for ASSISTANT");

        target.setPermissions(perms);
        return mallMemberRepository.save(target);
    }

    @Override
    public void deactivateAssistant(Long managerId, Long mallId, Long targetUserId) {
        permissionService.assertManager(managerId, mallId);

        MallMember target = mallMemberRepository.findActiveByUserAndMall(targetUserId, mallId);
        if (target == null) throw new InvalidMallOperationException("Target is not an active member");
        if (target.getRole() != MallMemberRole.ASSISTANT) throw new InvalidMallOperationException("Cannot deactivate a MANAGER");

        target.setIsActive(false);
        mallMemberRepository.save(target);
    }
}
