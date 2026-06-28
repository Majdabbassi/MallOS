package com.mmea.mallos.mall.repository;

import com.mmea.mallos.mall.model.MallMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MallMemberRepository extends JpaRepository<MallMember, Long>, JpaSpecificationExecutor<MallMember> {

    @Query("select m from MallMember m where m.user.id = :userId and m.mall.id = :mallId and m.isActive = true")
    MallMember findActiveByUserAndMall(@Param("userId") Long userId, @Param("mallId") Long mallId);
}
