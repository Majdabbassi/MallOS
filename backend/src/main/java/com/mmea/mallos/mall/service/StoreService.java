package com.mmea.mallos.mall.service;

import com.mmea.mallos.mall.dto.*;

import java.util.List;

public interface StoreService {

    StoreResponse       createStore(Long userId, Long mallId, CreateStoreRequest req);
    List<StoreResponse> listStores(Long userId, Long mallId);
    StoreResponse       getStore(Long userId, Long mallId, Long storeId);
    StoreResponse       updateStore(Long userId, Long mallId, Long storeId, UpdateStoreRequest req);
    void                deleteStore(Long userId, Long mallId, Long storeId);

    /** Returns stores not yet assigned to any polygon (for the Assign Store dropdown). */
    List<StoreResponse> listUnlinkedStores(Long userId, Long mallId);
}
