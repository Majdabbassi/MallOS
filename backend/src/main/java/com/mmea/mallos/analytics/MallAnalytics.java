package com.mmea.mallos.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Occupancy, rent and lease expiry of one mall, computed from its stores. */
public record MallAnalytics(
        LocalDate today,
        int totalUnits, int leasedUnits, int vacantUnits, double occupancyRate,
        BigDecimal monthlyRent, double leasedSurface, BigDecimal rentPerSqm, BigDecimal vacantPotentialRent,
        int expiringSoon, int expired,
        List<FloorStats> floors, List<CategoryStats> categories, List<Unit> units) {

    /** Lease state of a unit: VACANT, EXPIRED (past its end date but not vacated), EXPIRING (within 90 days), LEASED. */
    public record Unit(Long storeId, String code, String name, int floor, String category, String status,
                       Double surface, BigDecimal monthlyRent, String tenant, LocalDate contractEnd,
                       Long daysLeft, String leaseState) {
    }

    public record FloorStats(int level, int units, int leased, int vacant, double occupancyRate,
                             BigDecimal monthlyRent, double leasedSurface, BigDecimal rentPerSqm) {
    }

    public record CategoryStats(String category, int units, int leased, BigDecimal monthlyRent) {
    }
}
