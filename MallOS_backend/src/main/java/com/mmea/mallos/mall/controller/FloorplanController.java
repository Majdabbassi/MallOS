package com.mmea.mallos.mall.controller;

import com.mmea.mallos.mall.dto.*;
import com.mmea.mallos.mall.service.FloorplanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/malls/{mallId}/floors")
public class FloorplanController {

    private final FloorplanService floorplanService;

    // ─── Floor endpoints ─────────────────────────────────────────────────────

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FloorResponse> createFloor(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long mallId,
            @RequestParam("name") String name,
            @RequestParam("level") int level,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        FloorResponse response = floorplanService.createFloor(userId, mallId, name, level, image);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<FloorResponse>> listFloors(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long mallId) {

        return ResponseEntity.ok(floorplanService.listFloors(userId, mallId));
    }

    @GetMapping("/{floorId}")
    public ResponseEntity<FloorResponse> getFloor(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long mallId,
            @PathVariable Long floorId) {

        return ResponseEntity.ok(floorplanService.getFloor(userId, mallId, floorId));
    }

    @PutMapping("/{floorId}")
    public ResponseEntity<FloorResponse> updateFloor(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @Valid @RequestBody UpdateFloorRequest req) {

        return ResponseEntity.ok(floorplanService.updateFloor(userId, mallId, floorId, req));
    }

    @PutMapping("/{floorId}/status")
    public ResponseEntity<FloorResponse> updateFloorStatus(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @Valid @RequestBody UpdateFloorStatusRequest req) {

        return ResponseEntity.ok(
                floorplanService.updateFloorStatus(userId, mallId, floorId, req.getStatus()));
    }

    // ─── Geometry endpoint ───────────────────────────────────────────────────

    @GetMapping("/{floorId}/geometry")
    public ResponseEntity<GeometryResponse> getGeometry(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long mallId,
            @PathVariable Long floorId) {

        return ResponseEntity.ok(floorplanService.getGeometry(userId, mallId, floorId));
    }

    // ─── Polygon endpoints ───────────────────────────────────────────────────

    @PostMapping("/{floorId}/polygons")
    public ResponseEntity<PolygonResponse> createPolygon(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @Valid @RequestBody CreatePolygonRequest req) {

        return new ResponseEntity<>(
                floorplanService.createPolygon(userId, mallId, floorId, req), HttpStatus.CREATED);
    }

    @PutMapping("/{floorId}/polygons/{polygonId}")
    public ResponseEntity<PolygonResponse> updatePolygon(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @PathVariable Long polygonId,
            @RequestBody UpdatePolygonRequest req) {

        return ResponseEntity.ok(
                floorplanService.updatePolygon(userId, mallId, floorId, polygonId, req));
    }

    @DeleteMapping("/{floorId}/polygons/{polygonId}")
    public ResponseEntity<Void> deletePolygon(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @PathVariable Long polygonId) {

        floorplanService.deletePolygon(userId, mallId, floorId, polygonId);
        return ResponseEntity.noContent().build();
    }

    // ─── Store link endpoints ────────────────────────────────────────────────

    @PutMapping("/{floorId}/polygons/{polygonId}/store")
    public ResponseEntity<PolygonResponse> linkStore(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @PathVariable Long polygonId,
            @Valid @RequestBody LinkStoreRequest req) {

        return ResponseEntity.ok(
                floorplanService.linkStore(userId, mallId, floorId, polygonId, req.getStoreId()));
    }

    @DeleteMapping("/{floorId}/polygons/{polygonId}/store")
    public ResponseEntity<PolygonResponse> unlinkStore(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @PathVariable Long polygonId) {

        return ResponseEntity.ok(
                floorplanService.unlinkStore(userId, mallId, floorId, polygonId));
    }
}
