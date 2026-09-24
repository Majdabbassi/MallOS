package com.mmea.mallos.mall.controller;

import com.mmea.mallos.config.security.CurrentUserService;
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
    private final CurrentUserService currentUserService;

    // ─── Floor endpoints ─────────────────────────────────────────────────────

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FloorResponse> createFloor(
            @PathVariable Long mallId,
            @RequestParam("name") String name,
            @RequestParam("level") int level,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        Long userId = currentUserService.getCurrentUserId();
        FloorResponse response = floorplanService.createFloor(userId, mallId, name, level, image);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<FloorResponse>> listFloors(@PathVariable Long mallId) {
        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(floorplanService.listFloors(userId, mallId));
    }

    @GetMapping("/{floorId}")
    public ResponseEntity<FloorResponse> getFloor(
            @PathVariable Long mallId,
            @PathVariable Long floorId) {

        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(floorplanService.getFloor(userId, mallId, floorId));
    }

    /**
     * Serves the uploaded floor-plan image. Authenticated and tenant-scoped:
     * the caller must be an active member of the mall. The frontend fetches it
     * with an Authorization header and renders it as a blob.
     */
    @GetMapping(value = "/{floorId}/image", produces = MediaType.ALL_VALUE)
    public ResponseEntity<byte[]> getFloorImage(
            @PathVariable Long mallId,
            @PathVariable Long floorId) {

        Long userId = currentUserService.getCurrentUserId();
        FloorImage image = floorplanService.getFloorImage(userId, mallId, floorId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .body(image.data());
    }

    @PutMapping("/{floorId}")
    public ResponseEntity<FloorResponse> updateFloor(
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @Valid @RequestBody UpdateFloorRequest req) {

        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(floorplanService.updateFloor(userId, mallId, floorId, req));
    }

    /**
     * Attaches or replaces the source image of an existing floor. Used by the
     * trace editor to upload a plan without creating a duplicate floor.
     */
    @PutMapping(value = "/{floorId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FloorResponse> attachFloorImage(
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @RequestParam("image") MultipartFile image) {

        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(floorplanService.attachFloorImage(userId, mallId, floorId, image));
    }

    @PutMapping("/{floorId}/status")
    public ResponseEntity<FloorResponse> updateFloorStatus(
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @Valid @RequestBody UpdateFloorStatusRequest req) {

        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(
                floorplanService.updateFloorStatus(userId, mallId, floorId, req.getStatus()));
    }

    // ─── Geometry endpoint ───────────────────────────────────────────────────

    @GetMapping("/{floorId}/geometry")
    public ResponseEntity<GeometryResponse> getGeometry(
            @PathVariable Long mallId,
            @PathVariable Long floorId) {

        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(floorplanService.getGeometry(userId, mallId, floorId));
    }

    // ─── Polygon endpoints ───────────────────────────────────────────────────

    @PostMapping("/{floorId}/polygons")
    public ResponseEntity<PolygonResponse> createPolygon(
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @Valid @RequestBody CreatePolygonRequest req) {

        Long userId = currentUserService.getCurrentUserId();
        return new ResponseEntity<>(
                floorplanService.createPolygon(userId, mallId, floorId, req), HttpStatus.CREATED);
    }

    @PutMapping("/{floorId}/polygons/{polygonId}")
    public ResponseEntity<PolygonResponse> updatePolygon(
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @PathVariable Long polygonId,
            @RequestBody UpdatePolygonRequest req) {

        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(
                floorplanService.updatePolygon(userId, mallId, floorId, polygonId, req));
    }

    @DeleteMapping("/{floorId}/polygons/{polygonId}")
    public ResponseEntity<Void> deletePolygon(
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @PathVariable Long polygonId) {

        Long userId = currentUserService.getCurrentUserId();
        floorplanService.deletePolygon(userId, mallId, floorId, polygonId);
        return ResponseEntity.noContent().build();
    }

    // ─── Store link endpoints ────────────────────────────────────────────────

    @PutMapping("/{floorId}/polygons/{polygonId}/store")
    public ResponseEntity<PolygonResponse> linkStore(
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @PathVariable Long polygonId,
            @Valid @RequestBody LinkStoreRequest req) {

        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(
                floorplanService.linkStore(userId, mallId, floorId, polygonId, req.getStoreId()));
    }

    @DeleteMapping("/{floorId}/polygons/{polygonId}/store")
    public ResponseEntity<PolygonResponse> unlinkStore(
            @PathVariable Long mallId,
            @PathVariable Long floorId,
            @PathVariable Long polygonId) {

        Long userId = currentUserService.getCurrentUserId();
        return ResponseEntity.ok(
                floorplanService.unlinkStore(userId, mallId, floorId, polygonId));
    }
}