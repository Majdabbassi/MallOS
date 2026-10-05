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
import com.mmea.mallos.mall.model.enums.MallPermission;
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
    private final com.mmea.mallos.audit.AuditService audit;

    @Value("${upload.dir:./uploads}")
    private String uploadDir;

    // ─── Floor operations ────────────────────────────────────────────────────

    @Override
    @Transactional
    public FloorResponse createFloor(Long userId, Long mallId, String name, int level, MultipartFile image) {
        permissionService.assertAccess(userId, mallId, MallPermission.MANAGE_FLOORPLAN);
        Mall mall = mallRepository.findById(mallId)
                .orElseThrow(() -> new InvalidMallOperationException("Mall not found"));

        String imageFilename = null;
        if (image != null && !image.isEmpty()) {
            imageFilename = saveImage(image);
        }

        Floor floor = Floor.builder()
                .mall(mall)
                .name(name)
                .level(level)
                .sourceImageUrl(imageFilename)
                .status(FloorStatus.UPLOADED)
                .build();

        Floor saved = floorRepository.save(floor);
        audit.record(userId, mallId, "FLOOR_CREATED", "FLOOR", saved.getId(), saved.getLevel(),
                "Floor '" + saved.getName() + "' (level " + saved.getLevel() + ") added");
        return toFloorResponse(saved);
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
        permissionService.assertAccess(userId, mallId, MallPermission.MANAGE_FLOORPLAN);
        Floor floor = findFloor(mallId, floorId);
        if (req.getName()  != null) floor.setName(req.getName());
        if (req.getLevel() != null) floor.setLevel(req.getLevel());
        return toFloorResponse(floorRepository.save(floor));
    }

    @Override
    @Transactional
    public FloorResponse updateFloorStatus(Long userId, Long mallId, Long floorId, FloorStatus status) {
        permissionService.assertAccess(userId, mallId, MallPermission.MANAGE_FLOORPLAN);
        Floor floor = findFloor(mallId, floorId);
        FloorStatus was = floor.getStatus();
        floor.setStatus(status);
        Floor saved = floorRepository.save(floor);
        if (was != status) {
            audit.record(userId, mallId, "FLOOR_STATUS_CHANGED", "FLOOR", saved.getId(), saved.getLevel(),
                    "Floor '" + saved.getName() + "': " + was + " -> " + status);
        }
        return toFloorResponse(saved);
    }

    @Override
    @Transactional
    public FloorResponse attachFloorImage(Long userId, Long mallId, Long floorId, MultipartFile image) {
        permissionService.assertAccess(userId, mallId, MallPermission.MANAGE_FLOORPLAN);
        Floor floor = findFloor(mallId, floorId);

        if (image == null || image.isEmpty()) {
            throw new InvalidMallOperationException("No image provided");
        }

        String previous = floor.getSourceImageUrl();
        floor.setSourceImageUrl(saveImage(image));
        Floor saved = floorRepository.save(floor);

        deleteStoredImage(previous);
        return toFloorResponse(saved);
    }

    // ─── Polygon operations ──────────────────────────────────────────────────

    @Override
    @Transactional
    public PolygonResponse createPolygon(Long userId, Long mallId, Long floorId, CreatePolygonRequest req) {
        permissionService.assertAccess(userId, mallId, MallPermission.MANAGE_FLOORPLAN);
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
        permissionService.assertAccess(userId, mallId, MallPermission.MANAGE_FLOORPLAN);
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
        permissionService.assertAccess(userId, mallId, MallPermission.MANAGE_FLOORPLAN);
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
        permissionService.assertAccess(userId, mallId, MallPermission.MANAGE_FLOORPLAN);
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
        audit.record(userId, mallId, "STORE_LINKED", "STORE", store.getId(), floor.getLevel(),
                "Store '" + store.getName() + "' (" + store.getCode() + ") placed on the plan of '" + floor.getName() + "'");

        return toPolygonResponse(polygon, store);
    }

    @Override
    @Transactional
    public PolygonResponse unlinkStore(Long userId, Long mallId, Long floorId, Long polygonId) {
        permissionService.assertAccess(userId, mallId, MallPermission.MANAGE_FLOORPLAN);
        FloorPolygon polygon = findPolygon(floorId, polygonId);

        slotRepository.findByPolygon_Id(polygonId).ifPresent(slot -> {
            Store was = slot.getStore();
            slot.setStore(null);
            slotRepository.save(slot);
            if (was != null) {
                audit.record(userId, mallId, "STORE_UNLINKED", "STORE", was.getId(), polygon.getFloor().getLevel(),
                        "Store '" + was.getName() + "' (" + was.getCode() + ") taken off the floor plan");
            }
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

    private static final List<String> ALLOWED_EXTENSIONS = List.of("png", "jpg", "jpeg", "webp", "gif");

    private String saveImage(MultipartFile file) {
        String extension = detectImageExtension(file);
        try {
            Path dir = Paths.get(uploadDir);
            Files.createDirectories(dir);
            String filename = UUID.randomUUID() + "." + extension;
            Files.write(dir.resolve(filename), file.getBytes());
            return filename;
        } catch (IOException e) {
            throw new InvalidMallOperationException("Failed to save uploaded image: " + e.getMessage());
        }
    }

    /**
     * Best-effort removal of a previously stored image. Accepts both the raw
     * filename and the legacy "/uploads/<file>" reference. Never throws: a
     * missing/orphaned file must not fail the request that replaced it.
     */
    private void deleteStoredImage(String reference) {
        if (reference == null || reference.isBlank()) return;
        String filename = reference.startsWith("/uploads/")
                ? reference.substring("/uploads/".length())
                : reference;
        try {
            Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path file = Paths.get(uploadDir).resolve(filename).toAbsolutePath().normalize();
            if (file.startsWith(base)) {
                Files.deleteIfExists(file);
            }
        } catch (IOException ignored) {
            // Orphaned file is acceptable; do not fail the request.
        }
    }

    /**
     * Validates the uploaded file: it must be an image content type, its
     * magic bytes must match a supported raster format, and the declared file
     * extension must agree with the detected format.
     */
    private String detectImageExtension(MultipartFile file) {
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new InvalidMallOperationException("Failed to read uploaded image");
        }
        if (bytes.length == 0) {
            throw new InvalidMallOperationException("Uploaded file is empty");
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!contentType.startsWith("image/")) {
            throw new InvalidMallOperationException("Uploaded file is not an image (content type '" + contentType + "')");
        }

        String detected = detectFormatByContent(bytes);
        String declared = ALLOWED_EXTENSIONS.stream()
                .filter(ext -> file.getOriginalFilename() != null
                        && file.getOriginalFilename().toLowerCase().endsWith("." + ext))
                .findFirst()
                .orElse(null);

        if (declared == null) {
            throw new InvalidMallOperationException(
                    "Image file must have an .png, .jpg, .jpeg, .webp or .gif extension");
        }
        if (!detected.equals(declared)
                && !(detected.equals("jpg") && declared.equals("jpeg"))) {
            throw new InvalidMallOperationException(
                    "Image content (" + detected + ") does not match its '" + declared + "' extension");
        }
        return detected;
    }

    private String detectFormatByContent(byte[] bytes) {
        if (bytes.length >= 8 && (bytes[0] & 0xFF) == 0x89 && bytes[1] == 'P' && bytes[2] == 'N' && bytes[3] == 'G') {
            return "png";
        }
        if (bytes.length >= 3 && (bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8 && (bytes[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (bytes.length >= 6
                && bytes[0] == 'G' && bytes[1] == 'I' && bytes[2] == 'F'
                && bytes[3] == '8' && (bytes[4] == '7' || bytes[4] == '9') && bytes[5] == 'a') {
            return "gif";
        }
        if (bytes.length >= 12
                && bytes[0] == 'R' && bytes[1] == 'I' && bytes[2] == 'F' && bytes[3] == 'F'
                && bytes[8] == 'W' && bytes[9] == 'E' && bytes[10] == 'B' && bytes[11] == 'P') {
            return "webp";
        }
        throw new InvalidMallOperationException("Unsupported image format — only PNG, JPEG, GIF and WEBP are allowed");
    }

    @Override
    public FloorImage getFloorImage(Long userId, Long mallId, Long floorId) {
        permissionService.assertAccess(userId, mallId, null);
        Floor floor = findFloor(mallId, floorId);

        String ref = floor.getSourceImageUrl();
        if (ref == null || ref.isBlank()) {
            throw new FloorNotFoundException();
        }
        // Backwards compatibility: older rows stored a public "/uploads/<file>" URL.
        String filename = ref.startsWith("/uploads/") ? ref.substring("/uploads/".length()) : ref;

        Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path file = Paths.get(uploadDir).resolve(filename).toAbsolutePath().normalize();
        if (!file.startsWith(base) || !Files.isRegularFile(file)) {
            throw new FloorNotFoundException();
        }
        try {
            byte[] data = Files.readAllBytes(file);
            String contentType = Files.probeContentType(file);
            return new FloorImage(data, contentType != null ? contentType : "image/png");
        } catch (IOException e) {
            throw new InvalidMallOperationException("Failed to read floor-plan image");
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
                .sourceImageUrl(floor.getSourceImageUrl() != null
                        ? "/api/malls/" + floor.getMall().getId() + "/floors/" + floor.getId() + "/image"
                        : null)
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
