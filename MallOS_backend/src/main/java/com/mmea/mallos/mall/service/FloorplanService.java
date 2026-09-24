package com.mmea.mallos.mall.service;

import com.mmea.mallos.mall.dto.*;
import com.mmea.mallos.mall.model.enums.FloorStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FloorplanService {

    FloorResponse    createFloor(Long userId, Long mallId, String name, int level, MultipartFile image);
    List<FloorResponse> listFloors(Long userId, Long mallId);
    FloorResponse    getFloor(Long userId, Long mallId, Long floorId);
    FloorResponse    updateFloor(Long userId, Long mallId, Long floorId, UpdateFloorRequest req);
    FloorResponse    updateFloorStatus(Long userId, Long mallId, Long floorId, FloorStatus status);
    FloorResponse    attachFloorImage(Long userId, Long mallId, Long floorId, MultipartFile image);

    PolygonResponse  createPolygon(Long userId, Long mallId, Long floorId, CreatePolygonRequest req);
    PolygonResponse  updatePolygon(Long userId, Long mallId, Long floorId, Long polygonId, UpdatePolygonRequest req);
    void             deletePolygon(Long userId, Long mallId, Long floorId, Long polygonId);
    GeometryResponse getGeometry(Long userId, Long mallId, Long floorId);

    PolygonResponse  linkStore(Long userId, Long mallId, Long floorId, Long polygonId, Long storeId);
    PolygonResponse  unlinkStore(Long userId, Long mallId, Long floorId, Long polygonId);

    FloorImage       getFloorImage(Long userId, Long mallId, Long floorId);
}
