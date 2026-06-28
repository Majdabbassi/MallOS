package com.mmea.mallos.mall.controller;

import com.mmea.mallos.mall.dto.CreateMallRequest;
import com.mmea.mallos.mall.model.Mall;
import com.mmea.mallos.mall.service.MallService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequiredArgsConstructor
public class MallController {

    private final MallService mallService;

    @PostMapping("/malls")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Mall> createMall(@RequestHeader("X-User-Id") Long adminId, @RequestBody CreateMallRequest request) {
        Mall mall = mallService.createMall(adminId, request);
        return new ResponseEntity<>(mall, HttpStatus.CREATED);
    }

    @GetMapping("/malls/{mallId}")
    public ResponseEntity<Mall> getMall(@RequestHeader("X-User-Id") Long requesterId, @PathVariable Long mallId) {
        Mall mall = mallService.getMall(requesterId, mallId);
        return ResponseEntity.ok(mall);
    }
}
