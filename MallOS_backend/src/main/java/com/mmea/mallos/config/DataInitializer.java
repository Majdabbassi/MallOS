package com.mmea.mallos.config;

import com.mmea.mallos.mall.model.Floor;
import com.mmea.mallos.mall.model.Mall;
import com.mmea.mallos.mall.model.MallMember;
import com.mmea.mallos.mall.model.Store;
import com.mmea.mallos.mall.model.enums.FloorStatus;
import com.mmea.mallos.mall.model.enums.MallMemberRole;
import com.mmea.mallos.mall.model.enums.StoreCategory;
import com.mmea.mallos.mall.model.enums.StoreStatus;
import com.mmea.mallos.mall.repository.FloorRepository;
import com.mmea.mallos.mall.repository.MallMemberRepository;
import com.mmea.mallos.mall.repository.MallRepository;
import com.mmea.mallos.mall.repository.StoreRepository;
import com.mmea.mallos.user.model.User;
import com.mmea.mallos.user.model.enums.Role;
import com.mmea.mallos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Bootstraps the initial SUPER_ADMIN account and, optionally, a fully
 * populated demo mall so a fresh deployment is immediately usable.
 *
 * Credentials and the demo switch come from environment variables and are
 * never hardcoded. Skipped in the test profile so tests control their own data.
 */
@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final MallRepository mallRepository;
    private final FloorRepository floorRepository;
    private final StoreRepository storeRepository;
    private final MallMemberRepository mallMemberRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.username:}")
    private String adminUsername;

    @Value("${admin.email:}")
    private String adminEmail;

    @Value("${admin.password:}")
    private String adminPassword;

    @Value("${demo.enabled:true}")
    private boolean demoEnabled;

    @Value("${demo.manager.username:manager}")
    private String demoManagerUsername;

    @Value("${demo.manager.email:manager@mallos.local}")
    private String demoManagerEmail;

    @Value("${demo.manager.password:Manager@123}")
    private String demoManagerPassword;

    @Override
    @Transactional
    public void run(String... args) {
        if (adminPassword == null || adminPassword.isBlank()) {
            log.info("ADMIN_PASSWORD not set — skipping SUPER_ADMIN bootstrap (set admin.username/admin.email/admin.password to seed).");
            return;
        }

        User admin = null;
        if (userRepository.count() == 0) {
            admin = userRepository.save(User.builder()
                    .username(adminUsername.isBlank() ? "admin" : adminUsername)
                    .email(adminEmail.isBlank() ? "admin@mallos.local" : adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.SUPER_ADMIN)
                    .active(true)
                    .build());
            log.info("Bootstrapped initial SUPER_ADMIN '{}'", admin.getUsername());
        } else {
            admin = userRepository.findByUsername(adminUsername.isBlank() ? "admin" : adminUsername).orElse(null);
        }

        if (demoEnabled && mallRepository.count() == 0) {
            seedDemoMall(admin);
        }
    }

    private void seedDemoMall(User admin) {
        if (admin == null) {
            log.warn("Demo seed requested but no SUPER_ADMIN could be resolved — skipping demo data.");
            return;
        }

        Mall mall = mallRepository.save(Mall.builder()
                .name("Demo Mall")
                .companyName("Demo Mall Company")
                .address("123 Avenue Habib Bourguiba, Tunis")
                .taxId("DEMO-TAX-001")
                .createdBy(admin)
                .build());

        User manager = userRepository.findByUsername(demoManagerUsername).orElseGet(() ->
                userRepository.save(User.builder()
                        .username(demoManagerUsername)
                        .email(demoManagerEmail)
                        .password(passwordEncoder.encode(demoManagerPassword))
                        .role(Role.MALL_USER)
                        .active(true)
                        .build()));

        mallMemberRepository.save(MallMember.builder()
                .mall(mall)
                .user(manager)
                .role(MallMemberRole.MANAGER)
                .invitedBy(admin)
                .isActive(true)
                .build());

        floorRepository.save(Floor.builder()
                .mall(mall)
                .name("Ground Floor")
                .level(0)
                .status(FloorStatus.UPLOADED)
                .build());

        storeRepository.save(Store.builder()
                .mall(mall).name("Tech Arena").code("A-101").category(StoreCategory.ELECTRONICS)
                .floor(0).zone("A").surface(120.0).status(StoreStatus.OPEN)
                .ownerName("Karim Ben Ali").ownerPhone("+216 20 111 222").ownerEmail("karim@example.com")
                .monthlyRent(new BigDecimal("3500.00")).build());

        storeRepository.save(Store.builder()
                .mall(mall).name("Fashion Hub").code("A-102").category(StoreCategory.FASHION)
                .floor(0).zone("A").surface(85.0).status(StoreStatus.OPEN)
                .ownerName("Salma Trabelsi").ownerPhone("+216 21 333 444").ownerEmail("salma@example.com")
                .monthlyRent(new BigDecimal("2800.00")).build());

        storeRepository.save(Store.builder()
                .mall(mall).name("Cafe Central").code("B-201").category(StoreCategory.FOOD_BEVERAGE)
                .floor(0).zone("B").surface(60.0).status(StoreStatus.VACANT)
                .monthlyRent(new BigDecimal("1900.00")).build());

        log.info("Seeded demo mall '{}' with manager '{}' and 3 stores.", mall.getName(), manager.getUsername());
    }
}
