package com.mmea.mallos.mall.serviceimpl;

import com.mmea.mallos.mall.dto.InviteAssistantRequest;
import com.mmea.mallos.mall.exception.InvalidMallOperationException;
import com.mmea.mallos.mall.exception.MallNotFoundException;
import com.mmea.mallos.mall.exception.UserAlreadyMemberException;
import com.mmea.mallos.mall.model.Mall;
import com.mmea.mallos.mall.exception.MallAccessDeniedException;
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

import com.mmea.mallos.audit.AuditService;
import org.springframework.transaction.annotation.Transactional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MallMemberServiceImpl implements MallMemberService {

    private final UserRepository userRepository;
    private final MallRepository mallRepository;
    private final MallMemberRepository mallMemberRepository;
    private final PermissionService permissionService;
    private final AuditService audit;

    @Override
    @Transactional
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

        MallMember saved = mallMemberRepository.save(member);
        audit.record(adminId, mallId, "MANAGER_ASSIGNED", "MEMBER", user.getId(), null,
                user.getUsername() + " was made manager of " + mall.getName());
        return saved;
    }

    @Override
    @Transactional
    public MallMember assignManagerByIdentifier(Long adminId, Long mallId, String emailOrUsername) {
        if (emailOrUsername == null || emailOrUsername.isBlank()) {
            throw new InvalidMallOperationException("Username or email is required");
        }
        User user = userRepository.findByEmail(emailOrUsername.trim())
                .or(() -> userRepository.findByUsername(emailOrUsername.trim()))
                .orElseThrow(() -> new InvalidMallOperationException("User not found"));
        return assignManager(adminId, mallId, user.getId());
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public java.util.List<MallMember> listMembers(Long requesterId, Long mallId) {
        permissionService.assertTeamManager(requesterId, mallId);
        return mallMemberRepository.findActiveByMall(mallId);
    }

    @Override
    @Transactional
    public MallMember inviteAssistant(Long managerId, Long mallId, InviteAssistantRequest request) {
        MallMember delegate = permissionService.assertTeamManager(managerId, mallId);

        Mall mall = mallRepository.findById(mallId).orElseThrow(MallNotFoundException::new);

        User user = userRepository.findByEmail(request.getEmailOrUsername()).orElse(null);
        if (user == null) user = userRepository.findByUsername(request.getEmailOrUsername()).orElse(null);
        if (user == null) throw new InvalidMallOperationException("User not found");

        if (user.getRole() != Role.MALL_USER) throw new InvalidMallOperationException("Target user must be MALL_USER");

        MallMember existing = mallMemberRepository.findActiveByUserAndMall(user.getId(), mallId);
        if (existing != null) throw new UserAlreadyMemberException();

        Set<MallPermission> perms = request.getPermissions();
        if (perms == null || perms.isEmpty()) throw new InvalidMallOperationException("Assistant must have at least one permission");
        withinOwnRights(delegate, perms);

        User inviter = userRepository.findById(managerId).orElseThrow(() -> new InvalidMallOperationException("Manager not found"));

        MallMember member = MallMember.builder()
                .mall(mall)
                .user(user)
                .role(MallMemberRole.ASSISTANT)
                .permissions(perms)
                .invitedBy(inviter)
                .isActive(true)
                .build();

        MallMember saved = mallMemberRepository.save(member);
        audit.record(managerId, mallId, "MEMBER_INVITED", "MEMBER", user.getId(), null,
                user.getUsername() + " joined the team with " + sorted(perms));
        return saved;
    }

    @Override
    @Transactional
    public MallMember updatePermissions(Long managerId, Long mallId, Long targetUserId, Set<MallPermission> permissions) {
        MallMember delegate = permissionService.assertTeamManager(managerId, mallId);

        MallMember target = mallMemberRepository.findActiveByUserAndMall(targetUserId, mallId);
        if (target == null) throw new InvalidMallOperationException("Target is not an active member");
        if (target.getRole() != MallMemberRole.ASSISTANT) throw new InvalidMallOperationException("Cannot update permissions of a MANAGER");

        Set<MallPermission> perms = permissions;
        if (perms == null || perms.isEmpty()) throw new InvalidMallOperationException("Permissions set cannot be empty for ASSISTANT");
        mayManage(delegate, target);
        withinOwnRights(delegate, perms);

        Set<MallPermission> before = target.getPermissions() == null ? Set.of() : Set.copyOf(target.getPermissions());
        target.setPermissions(perms);
        MallMember saved = mallMemberRepository.save(target);
        audit.record(managerId, mallId, "PERMISSIONS_CHANGED", "MEMBER", targetUserId, null,
                target.getUser().getUsername() + ": " + sorted(before) + " -> " + sorted(perms));
        return saved;
    }

    @Override
    @Transactional
    public void deactivateAssistant(Long managerId, Long mallId, Long targetUserId) {
        MallMember delegate = permissionService.assertTeamManager(managerId, mallId);

        MallMember target = mallMemberRepository.findActiveByUserAndMall(targetUserId, mallId);
        if (target == null) throw new InvalidMallOperationException("Target is not an active member");
        if (target.getRole() != MallMemberRole.ASSISTANT) throw new InvalidMallOperationException("Cannot deactivate a MANAGER");
        mayManage(delegate, target);

        target.setIsActive(false);
        mallMemberRepository.save(target);
        audit.record(managerId, mallId, "MEMBER_REMOVED", "MEMBER", targetUserId, null,
                target.getUser().getUsername() + " was removed from the team");
    }

    /** An assistant running the team can only hand out permissions they hold themselves. */
    private static void withinOwnRights(MallMember delegate, Set<MallPermission> requested) {
        if (delegate == null) return; // manager or super admin
        Set<MallPermission> own = delegate.getPermissions() == null ? Set.of() : delegate.getPermissions();
        if (!own.containsAll(requested)) throw new MallAccessDeniedException();
    }

    /** ...and only change or remove assistants who are not themselves and have no right they lack. */
    private static void mayManage(MallMember delegate, MallMember target) {
        if (delegate == null) return;
        if (delegate.getUser().getId().equals(target.getUser().getId())) throw new MallAccessDeniedException();
        withinOwnRights(delegate, target.getPermissions() == null ? Set.of() : target.getPermissions());
    }

    private static String sorted(Set<MallPermission> permissions) {
        return permissions.stream().map(Enum::name).sorted().collect(java.util.stream.Collectors.joining(", ", "[", "]"));
    }
}
