package com.mmea.mallos.finance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RentInvoiceRepository extends JpaRepository<RentInvoice, Long> {

    List<RentInvoice> findByMall_IdOrderByPeriodDescStoreCodeAsc(Long mallId);

    List<RentInvoice> findByMall_IdAndPeriodOrderByStoreCodeAsc(Long mallId, String period);

    Optional<RentInvoice> findByIdAndMall_Id(Long id, Long mallId);

    boolean existsByStore_IdAndPeriod(Long storeId, String period);

    boolean existsByStore_Id(Long storeId);

    List<RentInvoice> findByStatus(InvoiceStatus status);
}
