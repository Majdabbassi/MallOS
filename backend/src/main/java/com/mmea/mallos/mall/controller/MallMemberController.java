package com.mmea.mallos.mall.controller;

import com.mmea.mallos.config.security.CurrentUserService;
import com.mmea.mallos.mall.dto.InviteAssistantRequest;
import com.mmea.mallos.mall.dto.MallMemberResponse;
import com.mmea.mallos.mall.dto.UpdatePermissionsRequest;
import com.mmea.mallos.mall.model.MallMember;
import com.mmea.mallos.mall.service.MallMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RequestMapping("/api/malls/{mallId}")
@RestController
@RequiredArgsConstructor
public class MallMemberController {

    private final MallMemberService mallMemberService;
    private final CurrentUserService currentUserService;

    @PostMapping("/managers/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<MallMemberResponse> assignManager(
            @PathVariable Long mallId,
            @PathVariable Long userId) {

        Long adminId = currentUserService.getCurrentUserId();
        return new ResponseEntity<>(toResponse(mallMemberService.assignManager(adminId, mallId, userId)), HttpStatus.CREATED);
    }

    /** Same as above, for the admin screen: the manager is picked by username or e-mail. */
    @PostMapping("/managers")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<MallMemberResponse> assignManagerByIdentifier(
            @PathVariable Long mallId,
            @RequestBody InviteAssistantRequest request) {

        Long adminId = currentUserService.getCurrentUserId();
        return new ResponseEntity<>(toResponse(
                mallMemberService.assignManagerByIdentifier(adminId, mallId, request.getEmailOrUsername())), HttpStatus.CREATED);
    }

    @GetMapping("/members")
    public ResponseEntity<java.util.List<MallMemberResponse>> listMembers(@PathVariable Long mallId) {
        Long requesterId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(mallMemberService.listMembers(requesterId, mallId).stream()
                .map(MallMemberController::toResponse).toList());
    }

    @PostMapping("/assistants")
    public ResponseEntity<MallMemberResponse> inviteAssistant(
            @PathVariable Long mallId,
            @RequestBody InviteAssistantRequest request) {

        Long managerId = currentUserService.getCurrentUserId();
        MallMember member = mallMemberService.inviteAssistant(managerId, mallId, request);
        MallMemberResponse resp = toResponse(member);
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    @PutMapping("/assistants/{userId}/permissions")
    public ResponseEntity<MallMemberResponse> updatePermissions(
            @PathVariable Long mallId,
            @PathVariable Long userId,
            @RequestBody UpdatePermissionsRequest request) {

        Long managerId = currentUserService.getCurrentUserId();
        MallMember member = mallMemberService.updatePermissions(managerId, mallId, userId, request.getPermissions());
        MallMemberResponse resp = toResponse(member);
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/assistants/{userId}")
    public ResponseEntity<Void> deactivateAssistant(
            @PathVariable Long mallId,
            @PathVariable Long userId) {

        Long managerId = currentUserService.getCurrentUserId();
        mallMemberService.deactivateAssistant(managerId, mallId, userId);
        return ResponseEntity.noContent().build();
    }

    private static MallMemberResponse toResponse(MallMember member) {
        return new MallMemberResponse(
                member.getUser().getId(),
                member.getUser().getUsername(),
                member.getRole(),
                member.getPermissions(),
                member.getIsActive(),
                member.getCreatedAt(),
                member.getUser().getEmail());
    }
}
