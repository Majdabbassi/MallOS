package com.mmea.mallos.mall.repository;

import com.mmea.mallos.mall.model.Mall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface MallRepository extends JpaRepository<Mall, Long>, JpaSpecificationExecutor<Mall> {
}
