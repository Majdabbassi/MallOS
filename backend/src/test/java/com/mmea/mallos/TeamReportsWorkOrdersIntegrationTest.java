package com.mmea.mallos;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mmea.mallos.user.model.User;
import com.mmea.mallos.user.model.enums.Role;
import com.mmea.mallos.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The three permissions that now have a meaning: MANAGE_EMPLOYEES (an assistant runs the team, within their own
 * rights), EDIT_REPORTS (CSV exports) and MANAGE_ORDERS (maintenance work orders).
 */
@SpringBootTest
@ActiveProfiles("test")
class TeamReportsWorkOrdersIntegrationTest {

    private static final String PASSWORD = "secret123";
    private static int seq = 0;

    @Autowired WebApplicationContext context;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(SecurityMockMvcConfigurers.springSecurity()).build();
    }

    // ------------------------------------------------------------------ helpers

    private String newUser(String prefix, Role role) {
        String name = prefix + "-tw" + (++seq);
        users.save(User.builder().username(name).email(name + "@test.local")
                .password(encoder.encode(PASSWORD)).role(role).active(true).build());
        return name;
    }

    private String bearer(String username) throws Exception {
        MvcResult login = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("username", username, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn();
        return "Bearer " + json.readTree(login.getResponse().getContentAsString()).get("token").asText();
    }

    private String mallWithManager(String admin, String manager) throws Exception {
        MvcResult created = mvc.perform(post("/api/malls").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", "TW mall " + seq, "companyName", "Co",
                                "address", "Somewhere", "taxId", "TW-" + seq))))
                .andExpect(status().isCreated()).andReturn();
        String mallId = json.readTree(created.getResponse().getContentAsString()).get("id").asText();
        mvc.perform(post("/api/malls/" + mallId + "/managers").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("emailOrUsername", manager))))
                .andExpect(status().isCreated());
        return mallId;
    }

    private ResultActions invite(String mallId, String by, String assistant, List<String> permissions) throws Exception {
        return mvc.perform(post("/api/malls/" + mallId + "/assistants").header("Authorization", bearer(by))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("emailOrUsername", assistant, "permissions", permissions))));
    }

    private ResultActions setPermissions(String mallId, String by, String target, List<String> permissions) throws Exception {
        long id = users.findByUsername(target).orElseThrow().getId();
        return mvc.perform(put("/api/malls/" + mallId + "/assistants/" + id + "/permissions").header("Authorization", bearer(by))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("permissions", permissions))));
    }

    private ResultActions remove(String mallId, String by, String target) throws Exception {
        long id = users.findByUsername(target).orElseThrow().getId();
        return mvc.perform(delete("/api/malls/" + mallId + "/assistants/" + id).header("Authorization", bearer(by)));
    }

    private String store(String mallId, String manager, String code, String owner) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "Shop " + code);
        body.put("code", code);
        body.put("category", "FASHION");
        body.put("floor", 0);
        body.put("status", "OPEN");
        body.put("surface", 80.0);
        body.put("monthlyRent", 1000);
        body.put("ownerName", owner);
        body.put("contractStart", "2026-01-01");
        MvcResult r = mvc.perform(post("/api/malls/" + mallId + "/stores").header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
                .andExpect(status().isCreated()).andReturn();
        return json.readTree(r.getResponse().getContentAsString()).get("id").asText();
    }

    private ResultActions newOrder(String mallId, String by, Map<String, Object> body) throws Exception {
        return mvc.perform(post("/api/malls/" + mallId + "/work-orders").header("Authorization", bearer(by))
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));
    }

    private ResultActions moveOrder(String mallId, String by, long id, String statusName) throws Exception {
        return mvc.perform(post("/api/malls/" + mallId + "/work-orders/" + id + "/status").header("Authorization", bearer(by))
                .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"" + statusName + "\",\"cost\":150}"));
    }

    private JsonNode body(ResultActions result) throws Exception {
        return json.readTree(result.andReturn().getResponse().getContentAsString());
    }

    // ------------------------------------------------------------------ MANAGE_EMPLOYEES: team delegation

    @Test
    void anAssistantWhoManagesTheTeamStaysWithinTheirOwnRights() throws Exception {
        String admin = newUser("admin", Role.SUPER_ADMIN);
        String manager = newUser("manager", Role.MALL_USER);
        String lead = newUser("lead", Role.MALL_USER);
        String helper = newUser("helper", Role.MALL_USER);
        String strong = newUser("strong", Role.MALL_USER);
        String newcomer = newUser("newcomer", Role.MALL_USER);
        String mallId = mallWithManager(admin, manager);
        invite(mallId, manager, lead, List.of("MANAGE_EMPLOYEES", "MANAGE_STORES", "VIEW_REPORTS")).andExpect(status().isCreated());
        invite(mallId, manager, strong, List.of("VIEW_FINANCE")).andExpect(status().isCreated());

        // the lead sees the team and invites with rights they hold
        mvc.perform(get("/api/malls/" + mallId + "/members").header("Authorization", bearer(lead))).andExpect(status().isOk());
        invite(mallId, lead, helper, List.of("MANAGE_STORES")).andExpect(status().isCreated());
        setPermissions(mallId, lead, helper, List.of("MANAGE_STORES", "VIEW_REPORTS")).andExpect(status().isOk());

        // ...but cannot hand out a right they do not have, or give themselves more
        invite(mallId, lead, newcomer, List.of("VIEW_FINANCE")).andExpect(status().isForbidden());
        setPermissions(mallId, lead, helper, List.of("MANAGE_FINANCE")).andExpect(status().isForbidden());
        setPermissions(mallId, lead, lead, List.of("MANAGE_EMPLOYEES", "MANAGE_STORES", "VIEW_REPORTS", "VIEW_FINANCE"))
                .andExpect(status().isForbidden());
        // cannot touch an assistant with rights they lack, nor the manager, nor remove themselves
        setPermissions(mallId, lead, strong, List.of("VIEW_REPORTS")).andExpect(status().isForbidden());
        remove(mallId, lead, strong).andExpect(status().isForbidden());
        remove(mallId, lead, lead).andExpect(status().isForbidden());
        remove(mallId, lead, manager).andExpect(status().isBadRequest());
        // can remove someone within their rights
        remove(mallId, lead, helper).andExpect(status().isNoContent());

        // an assistant without MANAGE_EMPLOYEES still cannot see or change the team
        mvc.perform(get("/api/malls/" + mallId + "/members").header("Authorization", bearer(strong))).andExpect(status().isForbidden());
        invite(mallId, strong, newcomer, List.of("VIEW_FINANCE")).andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------ EDIT_REPORTS: CSV exports

    @Test
    void exportsNeedTheExportRightAndAreSafeToOpenInASpreadsheet() throws Exception {
        String admin = newUser("admin", Role.SUPER_ADMIN);
        String manager = newUser("manager", Role.MALL_USER);
        String exporter = newUser("exporter", Role.MALL_USER);
        String viewer = newUser("viewer", Role.MALL_USER);
        String mallId = mallWithManager(admin, manager);
        invite(mallId, manager, exporter, List.of("EDIT_REPORTS")).andExpect(status().isCreated());
        invite(mallId, manager, viewer, List.of("VIEW_REPORTS", "VIEW_FINANCE")).andExpect(status().isCreated());
        store(mallId, manager, "X-1", "=HYPERLINK(\"http://evil\",\"click\")");
        store(mallId, manager, "X-2", "Smith, Jones & Co");

        MvcResult units = mvc.perform(get("/api/malls/" + mallId + "/reports/units.csv").header("Authorization", bearer(exporter)))
                .andExpect(status().isOk()).andReturn();
        String csv = units.getResponse().getContentAsString();
        assertTrue(units.getResponse().getContentType().startsWith("text/csv"));
        assertTrue(units.getResponse().getHeader("Content-Disposition").contains("units-and-leases.csv"));
        assertTrue(csv.startsWith("code,name,floor,category,status"), csv);
        assertTrue(csv.contains("\"'=HYPERLINK(\"\"http://evil\"\",\"\"click\"\")\""), "a formula is neutralized: " + csv);
        assertTrue(csv.contains("\"Smith, Jones & Co\""), "commas are quoted: " + csv);

        // viewing is not exporting; the invoice export also needs finance
        mvc.perform(get("/api/malls/" + mallId + "/reports/units.csv").header("Authorization", bearer(viewer))).andExpect(status().isForbidden());
        mvc.perform(get("/api/malls/" + mallId + "/reports/invoices.csv").header("Authorization", bearer(exporter))).andExpect(status().isForbidden());
        mvc.perform(post("/api/malls/" + mallId + "/invoices/generate?period=2026-03").header("Authorization", bearer(manager))).andExpect(status().isOk());
        String invoices = mvc.perform(get("/api/malls/" + mallId + "/reports/invoices.csv?period=2026-03").header("Authorization", bearer(manager)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertEquals(3, invoices.split("\n").length, "header and one line per store: " + invoices);

        // exports are in the audit trail
        String history = mvc.perform(get("/api/malls/" + mallId + "/audit").header("Authorization", bearer(manager)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertTrue(history.contains("REPORT_EXPORTED"), history);
    }

    // ------------------------------------------------------------------ MANAGE_ORDERS: maintenance work orders

    @Test
    void workOrdersFollowTheirLifeCycleAndStayInTheirMall() throws Exception {
        String admin = newUser("admin", Role.SUPER_ADMIN);
        String manager = newUser("manager", Role.MALL_USER);
        String tech = newUser("tech", Role.MALL_USER);
        String clerk = newUser("clerk", Role.MALL_USER);
        String otherManager = newUser("other", Role.MALL_USER);
        String mallId = mallWithManager(admin, manager);
        String otherMall = mallWithManager(admin, otherManager);
        invite(mallId, manager, tech, List.of("MANAGE_ORDERS")).andExpect(status().isCreated());
        invite(mallId, manager, clerk, List.of("MANAGE_STORES")).andExpect(status().isCreated());
        String storeId = store(mallId, manager, "W-1", "Tenant");
        String foreignStore = store(otherMall, otherManager, "W-9", "Tenant");

        JsonNode order = body(newOrder(mallId, tech, Map.of("title", "Leak in W-1", "priority", "HIGH",
                "storeId", Long.valueOf(storeId), "assignee", "Plumber")).andExpect(status().isOk()));
        long id = order.get("id").asLong();
        assertEquals("OPEN", order.get("status").asText());
        assertEquals("W-1", order.get("storeCode").asText());
        assertEquals(tech, order.get("reportedBy").asText());

        // nonsense and foreign references are refused
        newOrder(mallId, tech, Map.of("title", " ")).andExpect(status().isBadRequest());
        newOrder(mallId, tech, Map.of("title", "x", "storeId", Long.valueOf(foreignStore))).andExpect(status().isNotFound());
        // the permission is needed, and another mall's manager cannot reach this mall's orders
        newOrder(mallId, clerk, Map.of("title", "x")).andExpect(status().isForbidden());
        mvc.perform(get("/api/malls/" + mallId + "/work-orders").header("Authorization", bearer(clerk))).andExpect(status().isForbidden());
        moveOrder(otherMall, otherManager, id, "DONE").andExpect(status().isNotFound());
        moveOrder(mallId, otherManager, id, "DONE").andExpect(status().isForbidden());

        // life cycle: OPEN -> IN_PROGRESS -> DONE, then final
        moveOrder(mallId, tech, id, "IN_PROGRESS").andExpect(status().isOk());
        JsonNode done = body(moveOrder(mallId, tech, id, "DONE").andExpect(status().isOk()));
        assertEquals("DONE", done.get("status").asText());
        assertEquals(150, done.get("cost").asInt());
        assertTrue(!done.get("closedAt").isNull());
        moveOrder(mallId, tech, id, "OPEN").andExpect(status().isConflict());
        moveOrder(mallId, tech, id, "CANCELED").andExpect(status().isConflict());
        mvc.perform(put("/api/malls/" + mallId + "/work-orders/" + id).header("Authorization", bearer(tech))
                .contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"changed\"}")).andExpect(status().isConflict());

        // open work comes first, most urgent on top
        newOrder(mallId, manager, Map.of("title", "Light bulb", "priority", "LOW")).andExpect(status().isOk());
        newOrder(mallId, manager, Map.of("title", "Fire door stuck", "priority", "URGENT")).andExpect(status().isOk());
        JsonNode board = body(mvc.perform(get("/api/malls/" + mallId + "/work-orders").header("Authorization", bearer(tech))).andExpect(status().isOk()));
        assertEquals("Fire door stuck", board.get(0).get("title").asText());
        assertEquals("Light bulb", board.get(1).get("title").asText());
        assertEquals("DONE", board.get(2).get("status").asText());
        assertEquals(1, body(mvc.perform(get("/api/malls/" + mallId + "/work-orders?status=DONE").header("Authorization", bearer(tech)))).size());

        // every step is in the audit trail
        String history = mvc.perform(get("/api/malls/" + mallId + "/audit").header("Authorization", bearer(manager)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertTrue(history.contains("WORK_ORDER_OPENED") && history.contains("WORK_ORDER_DONE"), history);
    }
}
