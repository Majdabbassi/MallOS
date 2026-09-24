package com.mmea.mallos.mall.service;

import com.mmea.mallos.mall.model.Mall;
import com.mmea.mallos.mall.dto.CreateMallRequest;

import java.util.List;

public interface MallService {
    Mall createMall(Long adminId, CreateMallRequest request);
    Mall getMall(Long requesterId, Long mallId);
    List<Mall> listAll();
}
