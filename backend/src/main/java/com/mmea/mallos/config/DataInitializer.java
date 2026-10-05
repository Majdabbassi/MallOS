package com.mmea.mallos.config;

import com.mmea.mallos.mall.model.Floor;
import com.mmea.mallos.mall.model.Mall;
import com.mmea.mallos.mall.model.MallMember;
import com.mmea.mallos.mall.model.Store;
import com.mmea.mallos.mall.model.enums.FloorStatus;
import com.mmea.mallos.mall.model.enums.MallMemberRole;
import com.mmea.mallos.mall.model.enums.MallPermission;
import com.mmea.mallos.mall.model.enums.PolygonType;
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
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.multipart.MultipartFile;
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
    private final com.mmea.mallos.mall.service.FloorplanService floorplanService;
    private final com.mmea.mallos.mall.service.MallMemberService mallMemberService;

    @Value("${admin.username:}")
    private String adminUsername;

    @Value("${admin.email:}")
    private String adminEmail;

    @Value("${admin.password:}")
    private String adminPassword;

    @Value("${demo.enabled:true}")
    private boolean demoEnabled;
    @Value("${upload.dir:./uploads}")
    private String uploadDir;

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
        if (demoEnabled) {
            restoreDemoFloorImages();
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

        // Stores: one per unit of the demo floor plan
        record Unit(String code, String name, StoreCategory category, int zoneSurface, StoreStatus status,
                    String owner, String phone, String email, String rent, int x0, int y0, int x1, int y1) {}
        java.util.List<Unit> units = java.util.List.of(
                new Unit("A-101", "Tech Arena", StoreCategory.ELECTRONICS, 120, StoreStatus.OPEN, "Karim Ben Ali", "+216 20 111 222", "karim@example.com", "3500.00", 60, 60, 300, 420),
                new Unit("A-102", "Fashion Hub", StoreCategory.FASHION, 85, StoreStatus.OPEN, "Salma Trabelsi", "+216 21 333 444", "salma@example.com", "2800.00", 310, 60, 520, 420),
                new Unit("A-103", "Sport Zone", StoreCategory.SPORTS, 95, StoreStatus.OPEN, "Nizar Gharbi", "+216 22 555 666", "nizar@example.com", "3100.00", 530, 60, 740, 420),
                new Unit("A-104", "Book Corner", StoreCategory.BOOKS_GIFTS, 70, StoreStatus.OPEN, "Rim Jaziri", "+216 23 777 888", "rim@example.com", "2200.00", 750, 60, 940, 420),
                new Unit("B-201", "Cafe Central", StoreCategory.FOOD_BEVERAGE, 60, StoreStatus.VACANT, null, null, null, "1900.00", 60, 580, 360, 940),
                new Unit("B-202", "Glow Beauty", StoreCategory.HEALTH_BEAUTY, 75, StoreStatus.OPEN, "Hela Mansour", "+216 24 999 000", "hela@example.com", "2600.00", 370, 580, 640, 940),
                new Unit("B-203", "Cinema Lounge", StoreCategory.ENTERTAINMENT, 140, StoreStatus.UNDER_RENOVATION, "Anis Sassi", "+216 25 123 456", "anis@example.com", "4200.00", 650, 580, 940, 940));
        java.util.Map<String, Store> stores = new java.util.HashMap<>();
        for (Unit u : units) {
            stores.put(u.code(), storeRepository.save(Store.builder()
                    .mall(mall).name(u.name()).code(u.code()).category(u.category())
                    .floor(0).zone(u.code().substring(0, 1)).surface((double) u.zoneSurface()).status(u.status())
                    .ownerName(u.owner()).ownerPhone(u.phone()).ownerEmail(u.email())
                    .monthlyRent(new BigDecimal(u.rent())).build()));
        }

        // The floor goes through the real service, so the image is validated and stored like any upload
        Long managerId = manager.getId();
        com.mmea.mallos.mall.dto.FloorResponse floor = floorplanService.createFloor(
                managerId, mall.getId(), "Ground Floor", 0, classpathImage("demo/ground-floor.png"));
        floorplanService.createPolygon(managerId, mall.getId(), floor.getId(), polygon("Building", PolygonType.BOUNDARY, 40, 40, 960, 960));
        floorplanService.createPolygon(managerId, mall.getId(), floor.getId(), polygon("Main corridor", PolygonType.CORRIDOR, 48, 430, 952, 570));
        for (Unit u : units) {
            com.mmea.mallos.mall.dto.PolygonResponse poly = floorplanService.createPolygon(managerId, mall.getId(), floor.getId(),
                    polygon(u.code(), PolygonType.STORE, u.x0() + 4, u.y0() + 4, u.x1() - 4, u.y1() - 4));
            floorplanService.linkStore(managerId, mall.getId(), floor.getId(), poly.getId(), stores.get(u.code()).getId());
        }
        floorplanService.updateFloorStatus(managerId, mall.getId(), floor.getId(), FloorStatus.COMPLETED);

        // A second account with limited rights, to show the assistant permissions
        User assistant = userRepository.findByUsername("assistant").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("assistant")
                        .email("assistant@mallos.local")
                        .password(passwordEncoder.encode(demoManagerPassword))
                        .role(Role.MALL_USER)
                        .active(true)
                        .build()));
        com.mmea.mallos.mall.dto.InviteAssistantRequest invite = new com.mmea.mallos.mall.dto.InviteAssistantRequest();
        invite.setEmailOrUsername(assistant.getUsername());
        invite.setPermissions(java.util.Set.of(MallPermission.MANAGE_STORES, MallPermission.VIEW_REPORTS));
        mallMemberService.inviteAssistant(managerId, mall.getId(), invite);
        log.info("Seeded demo mall '{}' with manager '{}', an assistant, {} stores and a traced floor plan.", mall.getName(), manager.getUsername(), units.size());
    }

    /**
     * Hosts with an ephemeral disk (free tiers) lose uploaded files on every restart while the database keeps the
     * reference. The demo floor plan ships inside the jar, so put it back under the name the database expects.
     */
    private void restoreDemoFloorImages() {
        try {
            byte[] bytes = new ClassPathResource("demo/ground-floor.png").getInputStream().readAllBytes();
            for (Floor floor : floorRepository.findAll()) {
                String ref = floor.getSourceImageUrl();
                if (ref == null || ref.isBlank() || !"DEMO-TAX-001".equals(floor.getMall().getTaxId())) {
                    continue;
                }
                java.nio.file.Path target = java.nio.file.Paths.get(uploadDir).resolve(ref.replaceFirst("^/uploads/", ""));
                if (!java.nio.file.Files.exists(target)) {
                    java.nio.file.Files.createDirectories(target.getParent());
                    java.nio.file.Files.write(target, bytes);
                    log.info("Restored the demo floor plan image {}", target.getFileName());
                }
            }
        } catch (java.io.IOException e) {
            log.warn("Could not restore the demo floor plan image: {}", e.getMessage());
        }
    }

    private static com.mmea.mallos.mall.dto.CreatePolygonRequest polygon(String label, PolygonType type, double x0, double y0, double x1, double y1) {
        com.mmea.mallos.mall.dto.CreatePolygonRequest req = new com.mmea.mallos.mall.dto.CreatePolygonRequest();
        req.setLabel(label);
        req.setPolygonType(type);
        req.setPoints(java.util.List.of(point(x0, y0), point(x1, y0), point(x1, y1), point(x0, y1)));
        return req;
    }

    private static com.mmea.mallos.mall.dto.PointDto point(double x, double y) {
        com.mmea.mallos.mall.dto.PointDto p = new com.mmea.mallos.mall.dto.PointDto();
        p.setX(x);
        p.setY(y);
        return p;
    }

    /** An image bundled in the jar, presented as an uploaded file. */
    private static MultipartFile classpathImage(String path) {
        try {
            byte[] bytes = new ClassPathResource(path).getInputStream().readAllBytes();
            String filename = path.substring(path.lastIndexOf('/') + 1);
            return new MultipartFile() {
                public String getName() { return "image"; }
                public String getOriginalFilename() { return filename; }
                public String getContentType() { return "image/png"; }
                public boolean isEmpty() { return bytes.length == 0; }
                public long getSize() { return bytes.length; }
                public byte[] getBytes() { return bytes; }
                public java.io.InputStream getInputStream() { return new java.io.ByteArrayInputStream(bytes); }
                public void transferTo(java.io.File dest) throws java.io.IOException { java.nio.file.Files.write(dest.toPath(), bytes); }
            };
        } catch (java.io.IOException e) {
            throw new IllegalStateException("Demo floor plan missing: " + path, e);
        }
    }
}
