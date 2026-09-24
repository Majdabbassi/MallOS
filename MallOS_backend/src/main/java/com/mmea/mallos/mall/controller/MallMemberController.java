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

@RestController
@RequiredArgsConstructor
public class MallMemberController {

    private final MallMemberService mallMemberService;
    private final CurrentUserService currentUserService;

    @PostMapping("/malls/{mallId}/managers/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<MallMember> assignManager(
            @PathVariable Long mallId,
            @PathVariable Long userId) {

        Long adminId = currentUserService.getCurrentUserId();
        MallMember member = mallMemberService.assignManager(adminId, mallId, userId);
        return new ResponseEntity<>(member, HttpStatus.CREATED);
    }

    @PostMapping("/malls/{mallId}/assistants")
    public ResponseEntity<MallMemberResponse> inviteAssistant(
            @PathVariable Long mallId,
            @RequestBody InviteAssistantRequest request) {

        Long managerId = currentUserService.getCurrentUserId();
        MallMember member = mallMemberService.inviteAssistant(managerId, mallId, request);
        MallMemberResponse resp = new MallMemberResponse(
                member.getUser().getId(),
                member.getUser().getUsername(),
                member.getRole(),
                member.getPermissions(),
                member.getIsActive(),
                member.getCreatedAt());
        return new ResponseEntity<>(resp, HttpStatus.CREATED);
    }

    @PutMapping("/malls/{mallId}/assistants/{userId}/permissions")
    public ResponseEntity<MallMemberResponse> updatePermissions(
            @PathVariable Long mallId,
            @PathVariable Long userId,
            @RequestBody UpdatePermissionsRequest request) {

        Long managerId = currentUserService.getCurrentUserId();
        MallMember member = mallMemberService.updatePermissions(managerId, mallId, userId, request.getPermissions());
        MallMemberResponse resp = new MallMemberResponse(
                member.getUser().getId(),
                member.getUser().getUsername(),
                member.getRole(),
                member.getPermissions(),
                member.getIsActive(),
                member.getCreatedAt());
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/malls/{mallId}/assistants/{userId}")
    public ResponseEntity<Void> deactivateAssistant(
            @PathVariable Long mallId,
            @PathVariable Long userId) {

        Long managerId = currentUserService.getCurrentUserId();
        mallMemberService.deactivateAssistant(managerId, mallId, userId);
        return ResponseEntity.noContent().build();
    }
}
