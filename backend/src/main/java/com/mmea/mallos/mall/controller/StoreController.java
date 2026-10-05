package com.mmea.mallos.mall.controller;

import com.mmea.mallos.config.security.CurrentUserService;
import com.mmea.mallos.mall.dto.*;
import com.mmea.mallos.mall.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/malls/{mallId}/stores")
public class StoreController {

    private final StoreService storeService;
    private final CurrentUserService currentUserService;

    @PostMapping
    public ResponseEntity<StoreResponse> createStore(
            @PathVariable Long mallId,
            @Valid @RequestBody CreateStoreRequest req) {

        Long userId = currentUserService.getCurrentUserId();
        return new ResponseEntity<>(storeService.createStore(userId, mallId, req), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<StoreResponse>> listStores(@PathVariable Long mallId) {
        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(storeService.listStores(userId, mallId));
    }

    /**
     * Returns stores not yet linked to any polygon — used by the trace editor
     * sidebar "Assign Store" dropdown.
     * Must be declared before /{storeId} to avoid path collision.
     */
    @GetMapping("/unlinked")
    public ResponseEntity<List<StoreResponse>> listUnlinkedStores(@PathVariable Long mallId) {
        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(storeService.listUnlinkedStores(userId, mallId));
    }

    @GetMapping("/{storeId}")
    public ResponseEntity<StoreResponse> getStore(
            @PathVariable Long mallId,
            @PathVariable Long storeId) {

        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(storeService.getStore(userId, mallId, storeId));
    }

    @PutMapping("/{storeId}")
    public ResponseEntity<StoreResponse> updateStore(
            @PathVariable Long mallId,
            @PathVariable Long storeId,
            @RequestBody UpdateStoreRequest req) {

        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(storeService.updateStore(userId, mallId, storeId, req));
    }

    @DeleteMapping("/{storeId}")
    public ResponseEntity<Void> deleteStore(
            @PathVariable Long mallId,
            @PathVariable Long storeId) {

        Long userId = currentUserService.getCurrentUserId();
        storeService.deleteStore(userId, mallId, storeId);
        return ResponseEntity.noContent().build();
    }
}
