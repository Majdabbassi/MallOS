package com.mmea.mallos.mall.serviceimpl;

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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StoreServiceImpl implements StoreService {

    private final PermissionService permissionService;
    private final MallRepository    mallRepository;
    private final StoreRepository   storeRepository;
    private final SlotRepository    slotRepository;

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

        return toResponse(storeRepository.save(store));
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

        return toResponse(storeRepository.save(store));
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

        storeRepository.delete(store);
    }

    @Override
    public List<StoreResponse> listUnlinkedStores(Long userId, Long mallId) {
        permissionService.assertManager(userId, mallId);
        return storeRepository.findUnlinkedByMallId(mallId)
                .stream().map(this::toResponse).collect(Collectors.toList());
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
