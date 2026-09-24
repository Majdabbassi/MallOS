package com.mmea.mallos.mall.repository;

import com.mmea.mallos.mall.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface StoreRepository extends JpaRepository<Store, Long> {

    List<Store> findByMall_IdOrderByCodeAsc(Long mallId);

    Optional<Store> findByIdAndMall_Id(Long storeId, Long mallId);

    Optional<Store> findByMall_IdAndCode(Long mallId, String code);

    /**
     * Returns stores that belong to the given mall AND are not currently
     * referenced by any Slot with a non-null store field.
     * Used to populate the "Assign Store" dropdown in the trace editor.
     */
    @Query("SELECT s FROM Store s WHERE s.mall.id = :mallId " +
           "AND s.id NOT IN (SELECT sl.store.id FROM Slot sl WHERE sl.store IS NOT NULL)")
    List<Store> findUnlinkedByMallId(@Param("mallId") Long mallId);
}
