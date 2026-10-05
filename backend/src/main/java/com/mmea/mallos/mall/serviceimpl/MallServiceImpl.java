package com.mmea.mallos.mall.serviceimpl;

import com.mmea.mallos.mall.dto.CreateMallRequest;
import com.mmea.mallos.mall.exception.InvalidMallOperationException;
import com.mmea.mallos.mall.exception.MallNotFoundException;
import com.mmea.mallos.mall.model.Mall;
import com.mmea.mallos.mall.repository.MallRepository;
import com.mmea.mallos.mall.service.MallService;
import com.mmea.mallos.mall.service.PermissionService;
import com.mmea.mallos.user.model.User;
import com.mmea.mallos.user.model.enums.Role;
import com.mmea.mallos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MallServiceImpl implements MallService {

    private final MallRepository mallRepository;
    private final UserRepository userRepository;
    private final PermissionService permissionService;

    @Override
    public Mall createMall(Long adminId, CreateMallRequest request) {
        User admin = userRepository.findById(adminId).orElseThrow(() -> new InvalidMallOperationException("Admin not found"));
        if (admin.getRole() != Role.SUPER_ADMIN) throw new InvalidMallOperationException("Only SUPER_ADMIN can create malls");

        Mall mall = Mall.builder()
                .name(request.getName())
                .companyName(request.getCompanyName())
                .address(request.getAddress())
                .taxId(request.getTaxId())
                .createdBy(admin)
                .build();

        return mallRepository.save(mall);
    }

    @Override
    public Mall getMall(Long requesterId, Long mallId) {
        permissionService.assertAccess(requesterId, mallId, null);
        return mallRepository.findById(mallId).orElseThrow(MallNotFoundException::new);
    }

    @Override
    public List<Mall> listAll() {
        return mallRepository.findAll();
    }
}
