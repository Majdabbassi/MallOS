package com.mmea.mallos.analytics;

import com.mmea.mallos.analytics.MallAnalytics.CategoryStats;
import com.mmea.mallos.analytics.MallAnalytics.FloorStats;
import com.mmea.mallos.analytics.MallAnalytics.Unit;
import com.mmea.mallos.mall.model.Store;
import com.mmea.mallos.mall.model.enums.MallPermission;
import com.mmea.mallos.mall.model.enums.StoreStatus;
import com.mmea.mallos.mall.repository.StoreRepository;
import com.mmea.mallos.mall.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    /** A lease ending within this many days is "expiring". */
    static final int EXPIRING_DAYS = 90;

    private final StoreRepository stores;
    private final PermissionService permissions;

    @Transactional(readOnly = true)
    public MallAnalytics analyze(Long userId, Long mallId) {
        permissions.assertAccess(userId, mallId, MallPermission.VIEW_REPORTS);
        return compute(mallId);
    }

    /** The analysis itself, without a permission check: callers check first (see ReportExportService). */
    @Transactional(readOnly = true)
    public MallAnalytics compute(Long mallId) {
        LocalDate today = LocalDate.now();
        List<Store> all = stores.findByMall_IdOrderByCodeAsc(mallId);

        List<Unit> units = new ArrayList<>();
        for (Store s : all) {
            Long daysLeft = s.getContractEnd() == null ? null : ChronoUnit.DAYS.between(today, s.getContractEnd());
            units.add(new Unit(s.getId(), s.getCode(), s.getName(), s.getFloor(), s.getCategory().name(),
                    s.getStatus().name(), s.getSurface(), s.getMonthlyRent(), s.getOwnerName(), s.getContractEnd(),
                    daysLeft, leaseState(s, daysLeft)));
        }

        int leased = (int) units.stream().filter(u -> !u.leaseState().equals("VACANT")).count();
        int expiring = (int) units.stream().filter(u -> u.leaseState().equals("EXPIRING")).count();
        int expired = (int) units.stream().filter(u -> u.leaseState().equals("EXPIRED")).count();

        List<Store> leasedStores = all.stream().filter(s -> s.getStatus() != StoreStatus.VACANT).toList();
        BigDecimal rent = sumRent(leasedStores);
        double surface = surfaceWithRent(leasedStores);
        BigDecimal potential = sumRent(all.stream().filter(s -> s.getStatus() == StoreStatus.VACANT).toList());

        Map<Integer, List<Store>> byFloor = new TreeMap<>();
        all.forEach(s -> byFloor.computeIfAbsent(s.getFloor(), k -> new ArrayList<>()).add(s));
        List<FloorStats> floors = new ArrayList<>();
        byFloor.forEach((level, list) -> {
            List<Store> l = list.stream().filter(s -> s.getStatus() != StoreStatus.VACANT).toList();
            floors.add(new FloorStats(level, list.size(), l.size(), list.size() - l.size(), rate(l.size(), list.size()),
                    sumRent(l), surfaceWithRent(l), perSqm(sumRent(l), surfaceWithRent(l))));
        });

        Map<String, List<Store>> byCategory = new LinkedHashMap<>();
        all.forEach(s -> byCategory.computeIfAbsent(s.getCategory().name(), k -> new ArrayList<>()).add(s));
        List<CategoryStats> categories = new ArrayList<>();
        byCategory.forEach((category, list) -> {
            List<Store> l = list.stream().filter(s -> s.getStatus() != StoreStatus.VACANT).toList();
            categories.add(new CategoryStats(category, list.size(), l.size(), sumRent(l)));
        });
        categories.sort(Comparator.comparing(CategoryStats::monthlyRent).reversed());

        return new MallAnalytics(today, all.size(), leased, all.size() - leased, rate(leased, all.size()), rent, surface,
                perSqm(rent, surface), potential, expiring, expired, floors, categories, units);
    }

    private static String leaseState(Store s, Long daysLeft) {
        if (s.getStatus() == StoreStatus.VACANT) {
            return "VACANT";
        }
        if (daysLeft == null) {
            return "LEASED"; // open-ended lease
        }
        if (daysLeft < 0) {
            return "EXPIRED";
        }
        return daysLeft <= EXPIRING_DAYS ? "EXPIRING" : "LEASED";
    }

    private static BigDecimal sumRent(List<Store> list) {
        return list.stream().map(Store::getMonthlyRent).filter(r -> r != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, RoundingMode.HALF_UP);
    }

    /** Surface of the stores that have both a rent and a surface, so rent per m2 is not skewed by missing data. */
    private static double surfaceWithRent(List<Store> list) {
        return list.stream().filter(s -> s.getMonthlyRent() != null && s.getSurface() != null)
                .mapToDouble(Store::getSurface).sum();
    }

    private static BigDecimal perSqm(BigDecimal rent, double surface) {
        return surface <= 0 ? BigDecimal.ZERO : rent.divide(BigDecimal.valueOf(surface), 2, RoundingMode.HALF_UP);
    }

    private static double rate(int part, int whole) {
        return whole == 0 ? 0 : Math.round(part * 1000.0 / whole) / 10.0;
    }
}
