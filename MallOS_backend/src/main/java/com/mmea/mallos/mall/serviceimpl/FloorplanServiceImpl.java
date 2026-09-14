package com.mmea.mallos.mall.serviceimpl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mmea.mallos.mall.dto.*;
import com.mmea.mallos.mall.exception.FloorNotFoundException;
import com.mmea.mallos.mall.exception.PolygonNotFoundException;
import com.mmea.mallos.mall.exception.StoreNotFoundException;
import com.mmea.mallos.mall.exception.InvalidMallOperationException;
import com.mmea.mallos.mall.model.*;
import com.mmea.mallos.mall.model.enums.FloorStatus;
import com.mmea.mallos.mall.repository.*;
import com.mmea.mallos.mall.service.FloorplanService;
import com.mmea.mallos.mall.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FloorplanServiceImpl implements FloorplanService {

    private final PermissionService       permissionService;
    private final MallRepository          mallRepository;
    private final FloorRepository         floorRepository;
    private final FloorPolygonRepository  polygonRepository;
    private final SlotRepository          slotRepository;
    private final StoreRepository         storeRepository;
    private final ObjectMapper            objectMapper;

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    // ─── Floor operations ────────────────────────────────────────────────────

    @Override
    @Transactional
    public FloorResponse createFloor(Long userId, Long mallId, String name, int level, MultipartFile image) {
        permissionService.assertManager(userId, mallId);
        Mall mall = mallRepository.findById(mallId)
                .orElseThrow(() -> new InvalidMallOperationException("Mall not found"));

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = saveImage(image);
        }

        Floor floor = Floor.builder()
                .mall(mall)
                .name(name)
                .level(level)
                .sourceImageUrl(imageUrl)
                .status(FloorStatus.UPLOADED)
                .build();

        return toFloorResponse(floorRepository.save(floor));
    }

    @Override
    public List<FloorResponse> listFloors(Long userId, Long mallId) {
        permissionService.assertAccess(userId, mallId, null);
        return floorRepository.findByMall_IdOrderByLevelAsc(mallId)
                .stream().map(this::toFloorResponse).collect(Collectors.toList());
    }

    @Override
    public FloorResponse getFloor(Long userId, Long mallId, Long floorId) {
        permissionService.assertAccess(userId, mallId, null);
        return toFloorResponse(findFloor(mallId, floorId));
    }

    @Override
    @Transactional
    public FloorResponse updateFloor(Long userId, Long mallId, Long floorId, UpdateFloorRequest req) {
        permissionService.assertManager(userId, mallId);
        Floor floor = findFloor(mallId, floorId);
        if (req.getName()  != null) floor.setName(req.getName());
        if (req.getLevel() != null) floor.setLevel(req.getLevel());
        return toFloorResponse(floorRepository.save(floor));
    }

    @Override
    @Transactional
    public FloorResponse updateFloorStatus(Long userId, Long mallId, Long floorId, FloorStatus status) {
        permissionService.assertManager(userId, mallId);
        Floor floor = findFloor(mallId, floorId);
        floor.setStatus(status);
        return toFloorResponse(floorRepository.save(floor));
    }

    // ─── Polygon operations ──────────────────────────────────────────────────

    @Override
    @Transactional
    public PolygonResponse createPolygon(Long userId, Long mallId, Long floorId, CreatePolygonRequest req) {
        permissionService.assertManager(userId, mallId);
        Floor floor = findFloor(mallId, floorId);

        // Transition to TRACING on first polygon save if still UPLOADED
        if (floor.getStatus() == FloorStatus.UPLOADED) {
            floor.setStatus(FloorStatus.TRACING);
            floorRepository.save(floor);
        }

        FloorPolygon polygon = FloorPolygon.builder()
                .floor(floor)
                .points(serializePoints(req.getPoints()))
                .label(req.getLabel())
                .polygonType(req.getPolygonType())
                .build();

        return toPolygonResponse(polygonRepository.save(polygon), null);
    }

    @Override
    @Transactional
    public PolygonResponse updatePolygon(Long userId, Long mallId, Long floorId, Long polygonId, UpdatePolygonRequest req) {
        permissionService.assertManager(userId, mallId);
        FloorPolygon polygon = findPolygon(floorId, polygonId);

        if (req.getPoints()      != null) polygon.setPoints(serializePoints(req.getPoints()));
        if (req.getLabel()       != null) polygon.setLabel(req.getLabel());
        if (req.getPolygonType() != null) polygon.setPolygonType(req.getPolygonType());

        polygonRepository.save(polygon);
        Optional<Slot> slot = slotRepository.findByPolygon_Id(polygonId);
        return toPolygonResponse(polygon, slot.map(Slot::getStore).orElse(null));
    }

    @Override
    @Transactional
    public void deletePolygon(Long userId, Long mallId, Long floorId, Long polygonId) {
        permissionService.assertManager(userId, mallId);
        FloorPolygon polygon = findPolygon(floorId, polygonId);
        slotRepository.findByPolygon_Id(polygonId).ifPresent(slotRepository::delete);
        polygonRepository.delete(polygon);
    }

    @Override
    public GeometryResponse getGeometry(Long userId, Long mallId, Long floorId) {
        permissionService.assertAccess(userId, mallId, null);
        Floor floor = findFloor(mallId, floorId);
        List<FloorPolygon> polygons = polygonRepository.findByFloor_IdOrderByCreatedAtAsc(floorId);
        List<Slot> slots = slotRepository.findByFloor_Id(floorId);

        List<PolygonResponse> polygonResponses = polygons.stream().map(p -> {
            Store store = slots.stream()
                    .filter(s -> s.getPolygon().getId().equals(p.getId()) && s.getStore() != null)
                    .map(Slot::getStore)
                    .findFirst()
                    .orElse(null);
            return toPolygonResponse(p, store);
        }).collect(Collectors.toList());

        return GeometryResponse.builder()
                .floor(toFloorResponse(floor))
                .polygons(polygonResponses)
                .build();
    }

    // ─── Store linking ───────────────────────────────────────────────────────

    @Override
    @Transactional
    public PolygonResponse linkStore(Long userId, Long mallId, Long floorId, Long polygonId, Long storeId) {
        permissionService.assertManager(userId, mallId);
        Floor floor     = findFloor(mallId, floorId);
        FloorPolygon polygon = findPolygon(floorId, polygonId);

        Store store = storeRepository.findByIdAndMall_Id(storeId, mallId)
                .orElseThrow(() -> new StoreNotFoundException("Store not found or does not belong to this mall"));

        // If this store is already linked to a different polygon, reject
        slotRepository.findByStore_Id(storeId).ifPresent(existing -> {
            if (!existing.getPolygon().getId().equals(polygonId)) {
                throw new InvalidMallOperationException(
                        "Store '" + store.getName() + "' is already assigned to another polygon");
            }
        });

        Slot slot = slotRepository.findByPolygon_Id(polygonId)
                .orElseGet(() -> Slot.builder().floor(floor).polygon(polygon).build());
        slot.setStore(store);
        slotRepository.save(slot);

        return toPolygonResponse(polygon, store);
    }

    @Override
    @Transactional
    public PolygonResponse unlinkStore(Long userId, Long mallId, Long floorId, Long polygonId) {
        permissionService.assertManager(userId, mallId);
        FloorPolygon polygon = findPolygon(floorId, polygonId);

        slotRepository.findByPolygon_Id(polygonId).ifPresent(slot -> {
            slot.setStore(null);
            slotRepository.save(slot);
        });

        return toPolygonResponse(polygon, null);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Floor findFloor(Long mallId, Long floorId) {
        return floorRepository.findByIdAndMall_Id(floorId, mallId)
                .orElseThrow(FloorNotFoundException::new);
    }

    private FloorPolygon findPolygon(Long floorId, Long polygonId) {
        return polygonRepository.findByIdAndFloor_Id(polygonId, floorId)
                .orElseThrow(PolygonNotFoundException::new);
    }

    private String saveImage(MultipartFile file) {
        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Files.copy(file.getInputStream(), dir.resolve(filename));
            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new InvalidMallOperationException("Failed to save uploaded image: " + e.getMessage());
        }
    }

    private String serializePoints(List<PointDto> points) {
        try {
            return objectMapper.writeValueAsString(points);
        } catch (JsonProcessingException e) {
            throw new InvalidMallOperationException("Invalid polygon points");
        }
    }

    private List<PointDto> deserializePoints(String json) {
        try {
            return objectMapper.readValue(json, new TypeReference<List<PointDto>>() {});
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private FloorResponse toFloorResponse(Floor floor) {
        return FloorResponse.builder()
                .id(floor.getId())
                .mallId(floor.getMall().getId())
                .name(floor.getName())
                .level(floor.getLevel())
                .sourceImageUrl(floor.getSourceImageUrl())
                .width(floor.getWidth())
                .height(floor.getHeight())
                .status(floor.getStatus())
                .createdAt(floor.getCreatedAt())
                .updatedAt(floor.getUpdatedAt())
                .build();
    }

    private PolygonResponse toPolygonResponse(FloorPolygon polygon, Store store) {
        return PolygonResponse.builder()
                .id(polygon.getId())
                .floorId(polygon.getFloor().getId())
                .points(deserializePoints(polygon.getPoints()))
                .label(polygon.getLabel())
                .polygonType(polygon.getPolygonType())
                .store(store != null ? toStoreDto(store) : null)
                .createdAt(polygon.getCreatedAt())
                .updatedAt(polygon.getUpdatedAt())
                .build();
    }

    private StoreDto toStoreDto(Store store) {
        return StoreDto.builder()
                .id(store.getId())
                .name(store.getName())
                .code(store.getCode())
                .category(store.getCategory())
                .status(store.getStatus())
                .ownerName(store.getOwnerName())
                .surface(store.getSurface())
                .monthlyRent(store.getMonthlyRent())
                .build();
    }
}
