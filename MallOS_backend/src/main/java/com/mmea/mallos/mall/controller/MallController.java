package com.mmea.mallos.mall.controller;

import com.mmea.mallos.config.security.CurrentUserService;
import com.mmea.mallos.mall.dto.CreateMallRequest;
import com.mmea.mallos.mall.model.Mall;
import com.mmea.mallos.mall.service.MallService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class MallController {

    private final MallService mallService;
    private final CurrentUserService currentUserService;

    @PostMapping("/malls")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Mall> createMall(@RequestBody CreateMallRequest request) {
        Long adminId = currentUserService.getCurrentUserId();
        Mall mall = mallService.createMall(adminId, request);
        return new ResponseEntity<>(mall, HttpStatus.CREATED);
    }

    @GetMapping("/malls")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Mall>> listMalls() {
        return ResponseEntity.ok(mallService.listAll());
    }

    @GetMapping("/malls/{mallId}")
    public ResponseEntity<Mall> getMall(@PathVariable Long mallId) {
        Long userId = currentUserService.getCurrentUserId();
        Mall mall = mallService.getMall(userId, mallId);
        return ResponseEntity.ok(mall);
    }
}
