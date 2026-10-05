package com.mmea.mallos.mall.dto;

import com.mmea.mallos.mall.model.enums.MallMemberRole;
import com.mmea.mallos.mall.model.enums.MallPermission;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MallMemberResponse {
    private Long userId;
    private String username;
    private MallMemberRole role;
    private Set<MallPermission> permissions;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private String email;
}
