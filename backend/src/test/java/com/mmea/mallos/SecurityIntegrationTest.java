package com.mmea.mallos;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mmea.mallos.user.model.User;
import com.mmea.mallos.user.model.enums.Role;
import com.mmea.mallos.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SecurityIntegrationTest {

    @Autowired WebApplicationContext context;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(SecurityMockMvcConfigurers.springSecurity())
                .build();
    }

    private static final String PASSWORD = "secret123";
    private static int userSeq = 0;
    private static int mallSeq = 0;

    // ─── helpers ───────────────────────────────────────────────────────────

    /**
     * Authenticates via {@code /auth/login} and returns the issued JWT as a
     * Bearer header value.
     */
    private String bearer(String username) throws Exception {
        String token = objectMapper.readTree(login(username).getResponse().getContentAsString())
                .get("token").asText();
        return "Bearer " + token;
    }

    private String freshUser(String prefix) {
        String username = prefix + (++userSeq);
        userRepository.save(User.builder()
                .username(username)
                .email(username + "@test.local")
                .password(passwordEncoder.encode(PASSWORD))
                .role(Role.MALL_USER)
                .active(true)
                .build());
        return username;
    }

    private String rootAdmin() {
        return userRepository.findByUsername("root")
                .orElseGet(() -> userRepository.save(User.builder()
                        .username("root")
                        .email("root@test.local")
                        .password(passwordEncoder.encode(PASSWORD))
                        .role(Role.SUPER_ADMIN)
                        .active(true)
                        .build()))
                .getUsername();
    }

    /**
     * Creates a mall via /malls (as seeded SUPER_ADMIN) and assigns the given
     * MALL_USER as its manager.
     */
    private String givenMall(String manager) throws Exception {
        String name = "Mall-" + (++mallSeq);
        String admin = rootAdmin();

        MvcResult mallResult = mockMvc.perform(post("/api/malls")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", name,
                                "companyName", name + " Co",
                                "address", "123 Main St",
                                "taxId", "TAX-" + mallSeq))))
                .andExpect(status().isCreated())
                .andReturn();
        String mallId = objectMapper.readTree(mallResult.getResponse().getContentAsString()).get("id").asText();

        long managerId = userRepository.findByUsername(manager).orElseThrow().getId();
        mockMvc.perform(post("/api/malls/" + mallId + "/managers/" + managerId)
                .header("Authorization", bearer(admin)))
                .andExpect(status().isCreated());

        return mallId;
    }

    private long createFloor(String mallId, String manager) throws Exception {
        MvcResult result = mockMvc.perform(multipart("/api/malls/" + mallId + "/floors")
                        .header("Authorization", bearer(manager))
                        .param("name", "Ground Floor")
                        .param("level", "0"))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private long inviteAssistant(String mallId, String manager, String assistant, List<String> permissions)
            throws Exception {
        MvcResult result = mockMvc.perform(post("/api/malls/" + mallId + "/assistants")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "emailOrUsername", assistant,
                                "permissions", permissions))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("userId").asLong();
    }

    private MvcResult login(String username) throws Exception {
        return mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("username", username, "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn();
    }

    // ─── auth tests ────────────────────────────────────────────────────────

    @Test
    @Order(1)
    void registerForcesMallUserRole() throws Exception {
        String user = freshUser("roleuser");
        MvcResult result = login(user);
        String role = objectMapper.readTree(result.getResponse().getContentAsString()).get("role").asText();
        Assertions.assertEquals("MALL_USER", role);
    }

    @Test
    @Order(2)
    void registerIgnoresClientSuppliedRole() throws Exception {
        String username = "roleuser" + (++userSeq);
        // The role field no longer exists on RegisterRequest — sending it must not
        // escalate the new user to an admin.
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", username,
                                "email", username + "@test.local",
                                "password", PASSWORD,
                                "role", "SUPER_ADMIN"))))
                .andExpect(status().isOk());

        String role = objectMapper.readTree(login(username).getResponse().getContentAsString())
                .get("role").asText();
        Assertions.assertEquals("MALL_USER", role);

        // A MALL_USER must NOT be able to create a mall
        mockMvc.perform(post("/api/malls")
                        .header("Authorization", bearer(username))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("name", "Hax", "companyName", "", "address", "", "taxId", ""))))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(3)
    void unauthenticatedRequestReturns401() throws Exception {
        mockMvc.perform(get("/api/malls/1/stores"))
                .andExpect(status().isUnauthorized());
    }

    // ─── mall access tests ─────────────────────────────────────────────────

    @Test
    @Order(10)
    void managerCanAccessOwnMall() throws Exception {
        String manager = freshUser("mgr");
        String mallId = givenMall(manager);

        mockMvc.perform(get("/api/malls/" + mallId)
                        .header("Authorization", bearer(manager)))
                .andExpect(status().isOk());
    }

    @Test
    @Order(11)
    void nonMemberIsForbidden() throws Exception {
        String manager = freshUser("mgr2");
        String stranger = freshUser("str");
        String mallId = givenMall(manager);

        mockMvc.perform(get("/api/malls/" + mallId)
                        .header("Authorization", bearer(stranger)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(12)
    void crossTenantDenial() throws Exception {
        String managerA = freshUser("mgrA");
        String managerB = freshUser("mgrB");
        String mallA = givenMall(managerA);
        String mallB = givenMall(managerB);

        mockMvc.perform(get("/api/malls/" + mallB)
                        .header("Authorization", bearer(managerA)))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/malls/" + mallA)
                        .header("Authorization", bearer(managerB)))
                .andExpect(status().isForbidden());
    }

    // ─── polygon round-trip ────────────────────────────────────────────────

    // Regression: the demo plan stored pixel coordinates (64..960) while the viewer expects fractions (0..1), so its
    // polygons were drawn far outside the map and nothing on it could be hovered or clicked.
    @Test
    @Order(19)
    void polygonPointsMustBeFractionsOfTheImage() throws Exception {
        String manager = freshUser("polrange");
        String mallId = givenMall(manager);
        long floorId = createFloor(mallId, manager);
        for (var point : List.of(Map.of("x", 64, "y", 10), Map.of("x", 0.5, "y", -0.1), Map.of("x", 1.5, "y", 0.5))) {
            var body = Map.of("points", List.of(Map.of("x", 0.1, "y", 0.1), point), "polygonType", "STORE", "label", "Bad");
            mockMvc.perform(post("/api/malls/" + mallId + "/floors/" + floorId + "/polygons")
                            .header("Authorization", bearer(manager))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest());
        }
        mockMvc.perform(get("/api/malls/" + mallId + "/floors/" + floorId + "/geometry")
                        .header("Authorization", bearer(manager)))
                .andExpect(jsonPath("$.polygons.length()").value(0));
    }

    @Test
    @Order(20)
    void polygonCreateGetDeleteRoundTrip() throws Exception {
        String manager = freshUser("polmgr");
        String mallId = givenMall(manager);
        long floorId = createFloor(mallId, manager);

        var body = Map.of(
                "points", List.of(Map.of("x", 0, "y", 0), Map.of("x", 1, "y", 0), Map.of("x", 1, "y", 1)),
                "polygonType", "STORE",
                "label", "Polygon-A");
        MvcResult polyResult = mockMvc.perform(post("/api/malls/" + mallId + "/floors/" + floorId + "/polygons")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andReturn();
        long polygonId = objectMapper.readTree(polyResult.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/malls/" + mallId + "/floors/" + floorId + "/geometry")
                        .header("Authorization", bearer(manager)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.polygons.length()").value(1))
                .andExpect(jsonPath("$.polygons[0].label").value("Polygon-A"));

        mockMvc.perform(delete("/api/malls/" + mallId + "/floors/" + floorId + "/polygons/" + polygonId)
                        .header("Authorization", bearer(manager)))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/malls/" + mallId + "/floors/" + floorId + "/geometry")
                        .header("Authorization", bearer(manager)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.polygons.length()").value(0));
    }

    // ─── store unique code ─────────────────────────────────────────────────

    @Test
    @Order(30)
    void duplicateStoreCodeReturns409() throws Exception {
        String manager = freshUser("codmgr");
        String mallId = givenMall(manager);

        var store = Map.of(
                "name", "Boutique", "code", "A-1", "category", "FASHION",
                "status", "OPEN", "floor", 0);

        mockMvc.perform(post("/api/malls/" + mallId + "/stores")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(store)))
                .andExpect(status().isCreated());

        // duplicate code in same mall → 409
        mockMvc.perform(post("/api/malls/" + mallId + "/stores")
                        .header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(store)))
                .andExpect(status().isConflict());

        // same code in a different mall → 201 (allowed)
        String manager2 = freshUser("codmgr2");
        String mallId2 = givenMall(manager2);
        mockMvc.perform(post("/api/malls/" + mallId2 + "/stores")
                        .header("Authorization", bearer(manager2))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(store)))
                .andExpect(status().isCreated());
    }

    // ─── upload validation ─────────────────────────────────────────────────

    @Test
    @Order(40)
    void uploadRejectsNonImageExtension() throws Exception {
        String manager = freshUser("upmgr");
        String mallId = givenMall(manager);

        MockMultipartFile txt = new MockMultipartFile(
                "image", "plan.txt", "text/plain", "hello".getBytes());
        mockMvc.perform(multipart("/api/malls/" + mallId + "/floors")
                        .header("Authorization", bearer(manager))
                        .file(txt)
                        .param("name", "Test")
                        .param("level", "0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Order(41)
    void emptyFileParamCreatesFloorWithoutImage() throws Exception {
        String manager = freshUser("upmgr2");
        String mallId = givenMall(manager);

        MockMultipartFile empty = new MockMultipartFile(
                "image", "empty.png", "image/png", new byte[0]);
        mockMvc.perform(multipart("/api/malls/" + mallId + "/floors")
                        .header("Authorization", bearer(manager))
                        .file(empty)
                        .param("name", "Empty")
                        .param("level", "0"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sourceImageUrl").value((Object) null));
    }

    @Test
    @Order(42)
    void uploadAcceptsValidPng() throws Exception {
        String manager = freshUser("upmgr3");
        String mallId = givenMall(manager);

        byte[] pngBytes = Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB" +
                "Nl7BcQAAAABJRU5ErkJggg==");
        MockMultipartFile png = new MockMultipartFile(
                "image", "plan.png", "image/png", pngBytes);
        mockMvc.perform(multipart("/api/malls/" + mallId + "/floors")
                        .header("Authorization", bearer(manager))
                        .file(png)
                        .param("name", "G Floor")
                        .param("level", "0"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sourceImageUrl").value(
                        org.hamcrest.Matchers.startsWith("/api/malls/")));
    }

    @Test
    @Order(43)
    void uploadedImageServedOnlyWhenAuthenticated() throws Exception {
        String manager = freshUser("imgmgr");
        String mallId = givenMall(manager);

        byte[] pngBytes = Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB" +
                "Nl7BcQAAAABJRU5ErkJggg==");
        MockMultipartFile png = new MockMultipartFile(
                "image", "floor.png", "image/png", pngBytes);
        MvcResult createResult = mockMvc.perform(multipart("/api/malls/" + mallId + "/floors")
                        .header("Authorization", bearer(manager))
                        .file(png)
                        .param("name", "Level 1")
                        .param("level", "1"))
                .andExpect(status().isCreated())
                .andReturn();
        long floorId = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("id").asLong();

        // authenticated → 200 with PNG content type
        mockMvc.perform(get("/api/malls/" + mallId + "/floors/" + floorId + "/image")
                        .header("Authorization", bearer(manager)))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"));

        // no auth → 401
        mockMvc.perform(get("/api/malls/" + mallId + "/floors/" + floorId + "/image"))
                .andExpect(status().isUnauthorized());
    }

    // ─── permission gating ─────────────────────────────────────────────────

    @Test
    @Order(50)
    void assistantWithoutFloorplanPermissionCannotWriteFloor() throws Exception {
        String manager = freshUser("permgr");
        String mallId = givenMall(manager);
        long floorId = createFloor(mallId, manager);

        // invite assistant with an unrelated permission (MANAGE_PRODUCTS ≠ MANAGE_FLOORPLAN)
        String assistant = freshUser("permast");
        inviteAssistant(mallId, manager, assistant, List.of("MANAGE_PRODUCTS"));

        // assistant can read (any active member)
        mockMvc.perform(get("/api/malls/" + mallId + "/floors/" + floorId)
                        .header("Authorization", bearer(assistant)))
                .andExpect(status().isOk());

        // assistant cannot write — they have MANAGE_PRODUCTS but not MANAGE_FLOORPLAN → 403
        var body = Map.of(
                "points", List.of(Map.of("x", 0, "y", 0), Map.of("x", 0.1, "y", 0.1)),
                "polygonType", "STORE");
        mockMvc.perform(post("/api/malls/" + mallId + "/floors/" + floorId + "/polygons")
                        .header("Authorization", bearer(assistant))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(51)
    void assistantWithFloorplanPermissionCanWriteFloor() throws Exception {
        String manager = freshUser("permgr2");
        String mallId = givenMall(manager);
        long floorId = createFloor(mallId, manager);

        String assistant = freshUser("permast2");
        inviteAssistant(mallId, manager, assistant, List.of("MANAGE_FLOORPLAN"));

        var body = Map.of(
                "points", List.of(Map.of("x", 0, "y", 0), Map.of("x", 0.1, "y", 0.1)),
                "polygonType", "STORE",
                "label", "Assistant drew this");
        mockMvc.perform(post("/api/malls/" + mallId + "/floors/" + floorId + "/polygons")
                        .header("Authorization", bearer(assistant))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());
    }

    @Test
    @Order(52)
    void storeWriteGatedByManageStoresPermission() throws Exception {
        String manager = freshUser("storemgr");
        String mallId = givenMall(manager);

        // assistant that HAS MANAGE_STORES → 201
        String astWithPerm = freshUser("storeast");
        inviteAssistant(mallId, manager, astWithPerm, List.of("MANAGE_STORES"));

        var store = Map.of("name", "Shop", "code", "S-1", "category", "SERVICES", "status", "OPEN", "floor", 0);
        mockMvc.perform(post("/api/malls/" + mallId + "/stores")
                        .header("Authorization", bearer(astWithPerm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(store)))
                .andExpect(status().isCreated());

        // assistant WITHOUT MANAGE_STORES → 403 (has MANAGE_FLOORPLAN only)
        String astNoPerm = freshUser("storeast2");
        inviteAssistant(mallId, manager, astNoPerm, List.of("MANAGE_FLOORPLAN"));

        mockMvc.perform(post("/api/malls/" + mallId + "/stores")
                        .header("Authorization", bearer(astNoPerm))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("name", "Nope", "code", "S-2", "category", "SERVICES", "status", "OPEN", "floor", 0))))
                .andExpect(status().isForbidden());
    }

    // ─── super admin platform access ───────────────────────────────────────

    @Test
    @Order(60)
    void superAdminCanReadMallAndListMalls() throws Exception {
        String manager = freshUser("sadmgr");
        String mallId = givenMall(manager);
        String admin = rootAdmin();

        // Admin is not a MallMember, but must still be able to read the mall.
        mockMvc.perform(get("/api/malls/" + mallId)
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(Integer.parseInt(mallId)));

        // Platform-wide list endpoint is admin-only.
        mockMvc.perform(get("/api/malls")
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + mallId + ")]").exists());

        // A regular mall user must not be able to enumerate all malls.
        mockMvc.perform(get("/api/malls")
                        .header("Authorization", bearer(manager)))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(61)
    void superAdminCanReadMallStores() throws Exception {
        String manager = freshUser("sadmgr2");
        String mallId = givenMall(manager);
        String admin = rootAdmin();

        mockMvc.perform(get("/api/malls/" + mallId + "/stores")
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isOk());
    }

    // ─── floor image attach ────────────────────────────────────────────────

    @Test
    @Order(70)
    void attachImageReplacesExistingFloorImage() throws Exception {
        String manager = freshUser("attmgr");
        String mallId = givenMall(manager);
        long floorId = createFloor(mallId, manager);

        // Floor starts without an image.
        mockMvc.perform(get("/api/malls/" + mallId + "/floors/" + floorId)
                        .header("Authorization", bearer(manager)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sourceImageUrl").value((Object) null));

        byte[] pngBytes = Base64.getDecoder().decode(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB" +
                "Nl7BcQAAAABJRU5ErkJggg==");
        MockMultipartFile png = new MockMultipartFile("image", "plan.png", "image/png", pngBytes);

        // Attach image to the SAME floor — must not create a new one.
        mockMvc.perform(multipart("/api/malls/" + mallId + "/floors/" + floorId + "/image")
                        .with(req -> { req.setMethod("PUT"); return req; })
                        .header("Authorization", bearer(manager))
                        .file(png))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value((int) floorId))
                .andExpect(jsonPath("$.sourceImageUrl").value(
                        org.hamcrest.Matchers.startsWith("/api/malls/")));

        // Exactly one floor still exists.
        mockMvc.perform(get("/api/malls/" + mallId + "/floors")
                        .header("Authorization", bearer(manager)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    // ─── password-hash disclosure ──────────────────────────────────────────

    @Test
    @Order(80)
    void mallAndMemberResponsesNeverExposePasswordHash() throws Exception {
        String admin = rootAdmin();
        String manager = freshUser("leakmgr");
        String mallName = "LeakMall-" + (++mallSeq);

        // Mall creation returns Mall.createdBy (raw User) — must not leak the hash.
        MvcResult created = mockMvc.perform(post("/api/malls")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", mallName,
                                "companyName", mallName + " Co",
                                "address", "1 Leak St",
                                "taxId", "LEAK-" + mallSeq))))
                .andExpect(status().isCreated())
                .andReturn();
        assertNoPassword(created.getResponse().getContentAsString());
        String mallId = objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asText();

        // assignManager returns MallMember.user + invitedBy (raw Users).
        long managerId = userRepository.findByUsername(manager).orElseThrow().getId();
        MvcResult member = mockMvc.perform(post("/api/malls/" + mallId + "/managers/" + managerId)
                        .header("Authorization", bearer(admin)))
                .andExpect(status().isCreated())
                .andReturn();
        assertNoPassword(member.getResponse().getContentAsString());

        // Reading the mall back must not leak either.
        MvcResult read = mockMvc.perform(get("/api/malls/" + mallId)
                        .header("Authorization", bearer(manager)))
                .andExpect(status().isOk())
                .andReturn();
        assertNoPassword(read.getResponse().getContentAsString());
    }

    @Test
    @Order(81)
    void malformedRequestBodyReturnsBadRequest() throws Exception {
        String admin = rootAdmin();
        mockMvc.perform(post("/api/malls")
                        .header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ this is not json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    private static void assertNoPassword(String json) {
        org.assertj.core.api.Assertions.assertThat(json)
                .as("response must not contain a password field or bcrypt hash")
                .doesNotContainIgnoringCase("password")
                .doesNotContain("$2a$")
                .doesNotContain("$2b$")
                .doesNotContain("$2y$");
    }
}