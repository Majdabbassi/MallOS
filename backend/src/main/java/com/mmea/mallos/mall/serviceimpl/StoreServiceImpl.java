package com.mmea.mallos.mall.serviceimpl;

import com.mmea.mallos.audit.AuditService;
import com.mmea.mallos.finance.RentInvoiceRepository;
import com.mmea.mallos.mall.dto.*;
import com.mmea.mallos.mall.exception.DuplicateStoreCodeException;
import com.mmea.mallos.mall.exception.InvalidMallOperationException;
import com.mmea.mallos.mall.exception.MallNotFoundException;
import com.mmea.mallos.mall.exception.StoreNotFoundException;
import com.mmea.mallos.mall.model.Mall;
import com.mmea.mallos.mall.model.Store;
import com.mmea.mallos.mall.model.enums.MallPermission;
import com.mmea.mallos.mall.repository.MallRepository;
import com.mmea.mallos.mall.repository.SlotRepository;
import com.mmea.mallos.mall.repository.StoreRepository;
import com.mmea.mallos.mall.service.PermissionService;
import com.mmea.mallos.mall.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private final PermissionService permissionService;
    private final MallRepository    mallRepository;
    private final StoreRepository   storeRepository;
    private final SlotRepository    slotRepository;
    private final AuditService      audit;
    private final RentInvoiceRepository invoiceRepository;

    @Override
    @Transactional
    public StoreResponse createStore(Long userId, Long mallId, CreateStoreRequest req) {
        // Managers can always write; assistants need MANAGE_STORES in their stored set.
        permissionService.assertAccess(userId, mallId, MallPermission.MANAGE_STORES);
        Mall mall = mallRepository.findById(mallId)
                .orElseThrow(MallNotFoundException::new);

        assertUniqueCode(mallId, req.getCode(), null);

        Store store = Store.builder()
                .mall(mall)
                .name(req.getName())
                .code(req.getCode())
                .category(req.getCategory())
                .floor(req.getFloor())
                .zone(req.getZone())
                .surface(req.getSurface())
                .status(req.getStatus())
                .ownerName(req.getOwnerName())
                .ownerPhone(req.getOwnerPhone())
                .ownerEmail(req.getOwnerEmail())
                .contractStart(req.getContractStart())
                .contractEnd(req.getContractEnd())
                .monthlyRent(req.getMonthlyRent())
                .description(req.getDescription())
                .build();

        Store saved = storeRepository.save(store);
        audit.record(userId, mallId, "STORE_CREATED", "STORE", saved.getId(), saved.getFloor(),
                "Store '" + saved.getName() + "' (" + saved.getCode() + ") added on level " + saved.getFloor());
        return toResponse(saved);
    }

    @Override
    public List<StoreResponse> listStores(Long userId, Long mallId) {
        permissionService.assertAccess(userId, mallId, null);
        return storeRepository.findByMall_IdOrderByCodeAsc(mallId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public StoreResponse getStore(Long userId, Long mallId, Long storeId) {
        permissionService.assertAccess(userId, mallId, null);
        Store store = storeRepository.findByIdAndMall_Id(storeId, mallId)
                .orElseThrow(StoreNotFoundException::new);
        return toResponse(store);
    }

    @Override
    @Transactional
    public StoreResponse updateStore(Long userId, Long mallId, Long storeId, UpdateStoreRequest req) {
        permissionService.assertAccess(userId, mallId, MallPermission.MANAGE_STORES);
        Store store = storeRepository.findByIdAndMall_Id(storeId, mallId)
                .orElseThrow(StoreNotFoundException::new);

        if (req.getCode() != null && !req.getCode().equals(store.getCode())) {
            assertUniqueCode(mallId, req.getCode(), storeId);
        }
        Map<String, Object> before = snapshot(store);

        if (req.getName()          != null) store.setName(req.getName());
        if (req.getCode()          != null) store.setCode(req.getCode());
        if (req.getCategory()      != null) store.setCategory(req.getCategory());
        if (req.getFloor()         != null) store.setFloor(req.getFloor());
        if (req.getZone()          != null) store.setZone(req.getZone());
        if (req.getSurface()       != null) store.setSurface(req.getSurface());
        if (req.getStatus()        != null) store.setStatus(req.getStatus());
        if (req.getOwnerName()     != null) store.setOwnerName(req.getOwnerName());
        if (req.getOwnerPhone()    != null) store.setOwnerPhone(req.getOwnerPhone());
        if (req.getOwnerEmail()    != null) store.setOwnerEmail(req.getOwnerEmail());
        if (req.getContractStart() != null) store.setContractStart(req.getContractStart());
        if (req.getContractEnd()   != null) store.setContractEnd(req.getContractEnd());
        if (req.getMonthlyRent()   != null) store.setMonthlyRent(req.getMonthlyRent());
        if (req.getDescription()   != null) store.setDescription(req.getDescription());

        Store saved = storeRepository.save(store);
        String changes = changes(before, snapshot(saved));
        if (!changes.isEmpty()) {
            audit.record(userId, mallId, "STORE_UPDATED", "STORE", saved.getId(), saved.getFloor(),
                    "Store '" + saved.getName() + "' (" + saved.getCode() + "): " + changes);
        }
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteStore(Long userId, Long mallId, Long storeId) {
        permissionService.assertAccess(userId, mallId, MallPermission.MANAGE_STORES);
        Store store = storeRepository.findByIdAndMall_Id(storeId, mallId)
                .orElseThrow(StoreNotFoundException::new);

        // Prevent deletion if the store is currently linked to a polygon
        slotRepository.findByStore_Id(storeId).ifPresent(slot -> {
            throw new InvalidMallOperationException(
                    "Cannot delete store '" + store.getName() + "' — it is currently assigned to a floor polygon. Unlink it first.");
        });

        if (invoiceRepository.existsByStore_Id(storeId)) {
            throw new InvalidMallOperationException(
                    "Cannot delete store '" + store.getName() + "' - it has rent invoices. Mark it vacant instead.");
        }

        storeRepository.delete(store);
        audit.record(userId, mallId, "STORE_DELETED", "STORE", storeId, store.getFloor(),
                "Store '" + store.getName() + "' (" + store.getCode() + ") deleted");
    }

    @Override
    public List<StoreResponse> listUnlinkedStores(Long userId, Long mallId) {
        permissionService.assertManager(userId, mallId);
        return storeRepository.findUnlinkedByMallId(mallId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /** The fields whose changes are worth a line in the history (contact details are left out on purpose). */
    private static Map<String, Object> snapshot(Store s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", s.getName());
        m.put("code", s.getCode());
        m.put("category", s.getCategory());
        m.put("level", s.getFloor());
        m.put("zone", s.getZone());
        m.put("surface", s.getSurface());
        m.put("status", s.getStatus());
        m.put("tenant", s.getOwnerName());
        m.put("lease start", s.getContractStart());
        m.put("lease end", s.getContractEnd());
        m.put("rent", s.getMonthlyRent());
        return m;
    }

    private static String changes(Map<String, Object> before, Map<String, Object> after) {
        List<String> parts = new java.util.ArrayList<>();
        after.forEach((key, now) -> {
            Object was = before.get(key);
            boolean same = was instanceof java.math.BigDecimal a && now instanceof java.math.BigDecimal b
                    ? a.compareTo(b) == 0 : java.util.Objects.equals(was, now);
            if (!same) {
                parts.add(key + " " + (was == null ? "(none)" : was) + " -> " + (now == null ? "(none)" : now));
            }
        });
        return String.join("; ", parts);
    }

    private void assertUniqueCode(Long mallId, String code, Long excludeStoreId) {
        if (code != null && !code.isBlank()) {
            storeRepository.findByMall_IdAndCode(mallId, code)
                    .filter(existing -> excludeStoreId == null || !existing.getId().equals(excludeStoreId))
                    .ifPresent(existing -> {
                        throw new DuplicateStoreCodeException(
                                "Store code '" + code + "' is already used in this mall");
                    });
        }
    }

    private StoreResponse toResponse(Store store) {
        return StoreResponse.builder()
                .id(store.getId())
                .mallId(store.getMall().getId())
                .name(store.getName())
                .code(store.getCode())
                .category(store.getCategory())
                .floor(store.getFloor())
                .zone(store.getZone())
                .surface(store.getSurface())
                .status(store.getStatus())
                .ownerName(store.getOwnerName())
                .ownerPhone(store.getOwnerPhone())
                .ownerEmail(store.getOwnerEmail())
                .contractStart(store.getContractStart())
                .contractEnd(store.getContractEnd())
                .monthlyRent(store.getMonthlyRent())
                .description(store.getDescription())
                .createdAt(store.getCreatedAt())
                .updatedAt(store.getUpdatedAt())
                .build();
    }
}
