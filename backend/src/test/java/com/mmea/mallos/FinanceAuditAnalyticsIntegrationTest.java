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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

/** Rent invoices (billing, proration, late fees, who may do what), the audit trail, and the occupancy analytics. */
@SpringBootTest
@ActiveProfiles("test")
class FinanceAuditAnalyticsIntegrationTest {

    private static final String PASSWORD = "secret123";
    private static int seq = 1000;

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

    private record Mall(String id, String admin, String manager) {
    }

    private String newUser(String prefix, Role role) {
        String name = prefix + (++seq);
        users.save(User.builder().username(name).email(name + "@test.local")
                .password(encoder.encode(PASSWORD)).role(role).active(true).build());
        return name;
    }

    private String bearer(String username) throws Exception {
        MvcResult login = mvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("username", username, "password", PASSWORD)))).andReturn();
        assertEquals(200, login.getResponse().getStatus());
        return "Bearer " + json.readTree(login.getResponse().getContentAsString()).get("token").asText();
    }

    private MvcResult call(MockHttpServletRequestBuilder request, String user, Object body) throws Exception {
        if (user != null) {
            request.header("Authorization", bearer(user));
        }
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body instanceof String s ? s : json.writeValueAsString(body));
        }
        return mvc.perform(request).andReturn();
    }

    private JsonNode ok(MvcResult result) throws Exception {
        assertEquals(200, result.getResponse().getStatus(), result.getResponse().getContentAsString());
        return json.readTree(result.getResponse().getContentAsString());
    }

    private int status(MvcResult result) {
        return result.getResponse().getStatus();
    }

    private Mall newMall() throws Exception {
        String admin = newUser("admin", Role.SUPER_ADMIN);
        String manager = newUser("manager", Role.MALL_USER);
        MvcResult created = call(post("/api/malls"), admin, Map.of("name", "Mall " + seq, "companyName", "Co",
                "address", "Somewhere", "taxId", "T-" + seq));
        assertEquals(201, status(created));
        String id = json.readTree(created.getResponse().getContentAsString()).get("id").asText();
        assertEquals(201, status(call(post("/api/malls/" + id + "/managers"), admin, Map.of("emailOrUsername", manager))));
        return new Mall(id, admin, manager);
    }

    private String assistant(Mall mall, String... permissions) throws Exception {
        String name = newUser("assistant", Role.MALL_USER);
        assertEquals(201, status(call(post("/api/malls/" + mall.id() + "/assistants"), mall.manager(),
                Map.of("emailOrUsername", name, "permissions", List.of(permissions)))));
        return name;
    }

    private long store(Mall mall, String code, int floor, String status, Double surface, String rent, LocalDate start, LocalDate end) throws Exception {
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("name", "Shop " + code);
        body.put("code", code);
        body.put("category", "FASHION");
        body.put("floor", floor);
        body.put("status", status);
        body.put("ownerName", "Tenant " + code);
        if (surface != null) body.put("surface", surface);
        if (rent != null) body.put("monthlyRent", rent);
        if (start != null) body.put("contractStart", start.toString());
        if (end != null) body.put("contractEnd", end.toString());
        return ok201(call(post("/api/malls/" + mall.id() + "/stores"), mall.manager(), body)).get("id").asLong();
    }

    private JsonNode ok201(MvcResult result) throws Exception {
        assertEquals(201, status(result), result.getResponse().getContentAsString());
        return json.readTree(result.getResponse().getContentAsString());
    }

    private JsonNode invoices(Mall mall, String user, String query) throws Exception {
        return ok(call(get("/api/malls/" + mall.id() + "/invoices" + query), user, null));
    }

    private JsonNode invoiceOf(JsonNode list, String storeCode) {
        for (JsonNode i : list) {
            if (i.get("storeCode").asText().equals(storeCode)) return i;
        }
        throw new AssertionError("no invoice for " + storeCode + " in " + list);
    }

    private static final LocalDate JAN = LocalDate.of(2026, 1, 1);

    // ------------------------------------------------------------------ invoices

    @Test
    void eachBillableStoreIsBilledOncePerMonthAndPartialMonthsAreProrated() throws Exception {
        Mall mall = newMall();
        store(mall, "S1", 0, "OPEN", 100.0, "1000.00", JAN, null);                                   // full month
        store(mall, "S2", 0, "VACANT", 100.0, "1000.00", JAN, null);                                 // vacant: not billed
        store(mall, "S3", 0, "OPEN", 100.0, "1000.00", null, null);                                  // no lease start: not billed
        store(mall, "S4", 0, "OPEN", 100.0, "1000.00", LocalDate.of(2026, 3, 11), null);             // starts 11 March: 21 of 31 days
        store(mall, "S5", 0, "OPEN", 100.0, "1000.00", JAN, LocalDate.of(2026, 3, 10));              // ends 10 March: 10 of 31 days
        store(mall, "S6", 0, "OPEN", 100.0, "1000.00", JAN, LocalDate.of(2026, 2, 28));              // ended before March

        JsonNode first = ok(call(post("/api/malls/" + mall.id() + "/invoices/generate?period=2026-03"), mall.manager(), null));
        assertEquals(3, first.get("created").asInt());
        assertEquals(3, first.get("notBillable").asInt());

        JsonNode again = ok(call(post("/api/malls/" + mall.id() + "/invoices/generate?period=2026-03"), mall.manager(), null));
        assertEquals(0, again.get("created").asInt(), "generating twice must not bill twice");
        assertEquals(3, again.get("alreadyBilled").asInt());
        assertEquals(3, invoices(mall, mall.manager(), "?period=2026-03").size());

        JsonNode march = invoices(mall, mall.manager(), "?period=2026-03");
        assertEquals(1000.00, invoiceOf(march, "S1").get("amount").asDouble(), 0.001);
        assertEquals(677.42, invoiceOf(march, "S4").get("amount").asDouble(), 0.001);
        assertEquals(322.58, invoiceOf(march, "S5").get("amount").asDouble(), 0.001);
        assertEquals("2026-03-05", invoiceOf(march, "S1").get("dueDate").asText());
        assertEquals("Tenant S1", invoiceOf(march, "S1").get("tenantName").asText());

        // February: S4 has not started yet, S6 is still there for 28 days of 28
        JsonNode february = ok(call(post("/api/malls/" + mall.id() + "/invoices/generate?period=2026-02"), mall.manager(), null));
        assertEquals(3, february.get("created").asInt()); // S1, S5, S6
        assertEquals(1000.00, invoiceOf(invoices(mall, mall.manager(), "?period=2026-02"), "S6").get("amount").asDouble(), 0.001);

        // a store's changes later do not rewrite an issued invoice
        long s1 = invoiceOf(march, "S1").get("storeId").asLong();
        ok(call(put("/api/malls/" + mall.id() + "/stores/" + s1), mall.manager(), Map.of("monthlyRent", "5000.00", "ownerName", "New Tenant")));
        assertEquals(1000.00, invoiceOf(invoices(mall, mall.manager(), "?period=2026-03"), "S1").get("amount").asDouble(), 0.001);
        assertEquals("Tenant S1", invoiceOf(invoices(mall, mall.manager(), "?period=2026-03"), "S1").get("tenantName").asText());
    }

    @Test
    void anOverdueInvoiceCarriesOneLateFeeAndPaymentIsFinal() throws Exception {
        Mall mall = newMall();
        store(mall, "S1", 0, "OPEN", 100.0, "1000.00", JAN, null);
        store(mall, "S4", 0, "OPEN", 100.0, "1000.00", LocalDate.of(2026, 3, 11), null);
        store(mall, "S5", 0, "OPEN", 100.0, "1000.00", JAN, LocalDate.of(2026, 3, 10));
        ok(call(post("/api/malls/" + mall.id() + "/invoices/generate?period=2026-03"), mall.manager(), null));
        // a future month is not late
        store(mall, "F1", 0, "OPEN", 100.0, "1000.00", JAN, null);
        ok(call(post("/api/malls/" + mall.id() + "/invoices/generate?period=2099-01"), mall.manager(), null));
        assertFalse(invoiceOf(invoices(mall, mall.manager(), "?period=2099-01"), "S1").get("late").asBoolean());

        JsonNode late = invoices(mall, mall.manager(), "?state=LATE");
        assertEquals(3, late.size(), late.toString());
        JsonNode s1 = invoiceOf(late, "S1");
        assertEquals(50.00, s1.get("lateFee").asDouble(), 0.001, "5 percent of 1000");
        assertEquals(1050.00, s1.get("total").asDouble(), 0.001);
        assertTrue(s1.get("daysLate").asLong() > 0);

        assertEquals(3, ok(call(post("/api/malls/" + mall.id() + "/invoices/refresh"), mall.manager(), null)).get("lateFeesApplied").asInt());
        assertEquals(0, ok(call(post("/api/malls/" + mall.id() + "/invoices/refresh"), mall.manager(), null)).get("lateFeesApplied").asInt(),
                "the fee is added once, not on every run");
        assertEquals(50.00, invoiceOf(invoices(mall, mall.manager(), "?period=2026-03"), "S1").get("lateFee").asDouble(), 0.001);

        long paidId = s1.get("id").asLong();
        JsonNode paid = ok(call(post("/api/malls/" + mall.id() + "/invoices/" + paidId + "/pay"), mall.manager(), null));
        assertEquals("PAID", paid.get("status").asText());
        assertFalse(paid.get("late").asBoolean());
        assertNotNull(paid.get("paidDate"));
        assertEquals(409, status(call(post("/api/malls/" + mall.id() + "/invoices/" + paidId + "/pay"), mall.manager(), null)));
        assertEquals(409, status(call(post("/api/malls/" + mall.id() + "/invoices/" + paidId + "/cancel"), mall.manager(), null)));

        long canceledId = invoiceOf(late, "S5").get("id").asLong();
        assertEquals("CANCELED", ok(call(post("/api/malls/" + mall.id() + "/invoices/" + canceledId + "/cancel"), mall.manager(), null)).get("status").asText());
        assertEquals(409, status(call(post("/api/malls/" + mall.id() + "/invoices/" + canceledId + "/pay"), mall.manager(), null)));

        // who owes what: S1 paid, S5 canceled, S4 (677.42 + 5 percent = 711.29) is the only debtor of March; F1/S1 of 2099 are not due yet
        JsonNode summary = ok(call(get("/api/malls/" + mall.id() + "/finance/summary?period=2026-03"), mall.manager(), null));
        assertEquals(1677.42, summary.get("billed").asDouble(), 0.001);
        assertEquals(1000.00, summary.get("collected").asDouble(), 0.001);
        assertEquals(59.6, summary.get("collectionRate").asDouble(), 0.05);
        assertEquals(711.29, summary.get("overdue").asDouble(), 0.001);
        assertEquals(33.87, summary.get("lateFees").asDouble(), 0.001);
        JsonNode debtors = summary.get("debtors");
        assertEquals("S4", debtors.get(0).get("storeCode").asText(), "the worst debtor comes first");
        assertEquals(711.29, debtors.get(0).get("overdue").asDouble(), 0.001);
        assertEquals("2026-03-05", debtors.get(0).get("oldestDueDate").asText());
    }

    @Test
    void financeFollowsTheFinancePermissionsAndTheMallBoundary() throws Exception {
        Mall mall = newMall();
        Mall other = newMall();
        store(mall, "S1", 0, "OPEN", 100.0, "1000.00", JAN, null);
        ok(call(post("/api/malls/" + mall.id() + "/invoices/generate?period=2026-03"), mall.manager(), null));
        long invoiceId = invoices(mall, mall.manager(), "").get(0).get("id").asLong();

        String reportsOnly = assistant(mall, "VIEW_REPORTS");
        String viewer = assistant(mall, "VIEW_FINANCE");
        String finance = assistant(mall, "MANAGE_FINANCE");
        String outsider = newUser("outsider", Role.MALL_USER);

        // no login
        assertEquals(401, status(call(get("/api/malls/" + mall.id() + "/invoices"), null, null)));
        // nobody outside the mall, and no other mall's manager
        for (String stranger : new String[]{outsider, other.manager()}) {
            assertEquals(403, status(call(get("/api/malls/" + mall.id() + "/invoices"), stranger, null)));
            assertEquals(403, status(call(get("/api/malls/" + mall.id() + "/finance/summary"), stranger, null)));
            assertEquals(403, status(call(post("/api/malls/" + mall.id() + "/invoices/" + invoiceId + "/pay"), stranger, null)));
        }
        // a team member without the finance permission
        assertEquals(403, status(call(get("/api/malls/" + mall.id() + "/invoices"), reportsOnly, null)));
        assertEquals(403, status(call(get("/api/malls/" + mall.id() + "/finance/summary"), reportsOnly, null)));
        // viewing is not changing
        assertEquals(200, status(call(get("/api/malls/" + mall.id() + "/invoices"), viewer, null)));
        assertEquals(200, status(call(get("/api/malls/" + mall.id() + "/finance/summary"), viewer, null)));
        assertEquals(403, status(call(post("/api/malls/" + mall.id() + "/invoices/generate"), viewer, null)));
        assertEquals(403, status(call(post("/api/malls/" + mall.id() + "/invoices/" + invoiceId + "/pay"), viewer, null)));
        assertEquals(403, status(call(post("/api/malls/" + mall.id() + "/invoices/refresh"), viewer, null)));
        // managing without viewing is allowed to act
        assertEquals(200, status(call(post("/api/malls/" + mall.id() + "/invoices/" + invoiceId + "/pay"), finance, null)));
        // the platform administrator can do everything
        assertEquals(200, status(call(get("/api/malls/" + mall.id() + "/finance/summary"), mall.admin(), null)));

        // an invoice id of another mall is not found through this mall's address
        store(other, "O1", 0, "OPEN", 100.0, "900.00", JAN, null);
        ok(call(post("/api/malls/" + other.id() + "/invoices/generate?period=2026-03"), other.manager(), null));
        long foreign = invoices(other, other.manager(), "").get(0).get("id").asLong();
        assertEquals(404, status(call(post("/api/malls/" + mall.id() + "/invoices/" + foreign + "/pay"), mall.manager(), null)));
        assertEquals(1, invoices(mall, mall.manager(), "").size(), "no leakage between malls");

        // tidy answers to bad input
        assertEquals(400, status(call(post("/api/malls/" + mall.id() + "/invoices/generate?period=March"), mall.manager(), null)));
        assertEquals(400, status(call(get("/api/malls/" + mall.id() + "/invoices?state=WEIRD"), mall.manager(), null)));
        assertEquals(404, status(call(post("/api/malls/" + mall.id() + "/invoices/999999/pay"), mall.manager(), null)));
    }

    @Test
    void aStoreThatHasBeenBilledCannotBeDeleted() throws Exception {
        Mall mall = newMall();
        long billed = store(mall, "S1", 0, "OPEN", 100.0, "1000.00", JAN, null);
        long unbilled = store(mall, "S2", 0, "VACANT", 100.0, "1000.00", null, null);
        ok(call(post("/api/malls/" + mall.id() + "/invoices/generate?period=2026-03"), mall.manager(), null));
        assertEquals(400, status(call(delete("/api/malls/" + mall.id() + "/stores/" + billed), mall.manager(), null)));
        assertEquals(204, status(call(delete("/api/malls/" + mall.id() + "/stores/" + unbilled), mall.manager(), null)));
    }

    // ------------------------------------------------------------------ audit trail

    private JsonNode history(Mall mall, String user, String query) throws Exception {
        return ok(call(get("/api/malls/" + mall.id() + "/audit" + query), user, null));
    }

    private List<String> actions(JsonNode entries) {
        List<String> actions = new ArrayList<>();
        entries.forEach(e -> actions.add(e.get("action").asText()));
        return actions;
    }

    @Test
    void theHistoryRecordsWhoDidWhatAndOnlyWhatReallyHappened() throws Exception {
        Mall mall = newMall();
        long shop = store(mall, "H1", 1, "OPEN", 80.0, "1000.00", JAN, null);
        String helper = assistant(mall, "VIEW_REPORTS");

        ok(call(put("/api/malls/" + mall.id() + "/stores/" + shop), mall.manager(), Map.of("monthlyRent", "1200.00", "status", "CLOSED")));
        ok(call(put("/api/malls/" + mall.id() + "/stores/" + shop), mall.manager(), Map.of("monthlyRent", "1200")));   // nothing changes
        long helperId = users.findByUsername(helper).orElseThrow().getId();
        ok(call(put("/api/malls/" + mall.id() + "/assistants/" + helperId + "/permissions"), mall.manager(),
                Map.of("permissions", List.of("VIEW_REPORTS", "VIEW_FINANCE"))));
        ok(call(post("/api/malls/" + mall.id() + "/invoices/generate?period=2026-03"), mall.manager(), null));
        long invoice = invoices(mall, mall.manager(), "").get(0).get("id").asLong();
        ok(call(post("/api/malls/" + mall.id() + "/invoices/" + invoice + "/pay"), mall.manager(), null));

        JsonNode all = history(mall, mall.manager(), "");
        List<String> actions = actions(all);
        assertEquals(List.of("INVOICE_PAID", "INVOICES_GENERATED", "PERMISSIONS_CHANGED", "STORE_UPDATED",
                "MEMBER_INVITED", "STORE_CREATED", "MANAGER_ASSIGNED", "MALL_CREATED"), actions,
                "newest first; the update that changed nothing left no entry");

        JsonNode update = all.get(3);
        assertEquals(mall.manager(), update.get("actorName").asText());
        assertEquals(1, update.get("floorLevel").asInt());
        String summary = update.get("summary").asText();
        assertTrue(summary.contains("rent 1000.00 -> 1200.00"), summary);
        assertTrue(summary.contains("status OPEN -> CLOSED"), summary);
        assertFalse(summary.contains("tenant"), "unchanged fields are not listed: " + summary);
        assertTrue(all.get(2).get("summary").asText().contains("[VIEW_REPORTS] -> [VIEW_FINANCE, VIEW_REPORTS]"));
        assertEquals(mall.admin(), all.get(7).get("actorName").asText());

        // filters
        assertEquals(List.of("INVOICE_PAID", "INVOICES_GENERATED"), actions(history(mall, mall.manager(), "?action=INVOICE")));
        assertEquals(List.of("INVOICE_PAID", "STORE_UPDATED", "STORE_CREATED"), actions(history(mall, mall.manager(), "?floor=1")));
        assertEquals(2, history(mall, mall.manager(), "?actor=" + mall.admin()).size(), "the admin created the mall and made the manager");
        assertEquals(2, history(mall, mall.manager(), "?limit=2").size());
        assertEquals(1, history(mall, mall.manager(), "?entityType=MEMBER&action=PERMISSIONS").size());

        // a failed operation leaves nothing behind
        int before = history(mall, mall.manager(), "").size();
        assertEquals(409, status(call(post("/api/malls/" + mall.id() + "/stores"), mall.manager(),
                Map.of("name", "Dup", "code", "H1", "category", "FASHION", "status", "OPEN", "floor", 1))));
        assertEquals(before, history(mall, mall.manager(), "").size());
    }

    @Test
    void theHistoryIsForManagersAndStaysInsideItsMall() throws Exception {
        Mall mall = newMall();
        Mall other = newMall();
        String helper = assistant(mall, "VIEW_REPORTS", "VIEW_FINANCE", "MANAGE_STORES");
        store(other, "X1", 0, "OPEN", 50.0, "500.00", JAN, null);

        assertEquals(401, status(call(get("/api/malls/" + mall.id() + "/audit"), null, null)));
        assertEquals(403, status(call(get("/api/malls/" + mall.id() + "/audit"), helper, null)), "assistants do not read the history");
        assertEquals(403, status(call(get("/api/malls/" + mall.id() + "/audit"), other.manager(), null)));
        assertEquals(200, status(call(get("/api/malls/" + mall.id() + "/audit"), mall.admin(), null)));
        for (JsonNode e : history(mall, mall.manager(), "")) {
            assertEquals(Long.parseLong(mall.id()), e.get("mallId").asLong());
        }
        assertFalse(actions(history(mall, mall.manager(), "")).contains("STORE_CREATED"), "the other mall's store is not in this history");
    }

    // ------------------------------------------------------------------ analytics

    @Test
    void analyticsCountOccupancyRentPerSquareMeterAndLeaseExpiry() throws Exception {
        Mall mall = newMall();
        LocalDate today = LocalDate.now();
        store(mall, "A", 0, "OPEN", 100.0, "1000.00", JAN, today.plusDays(30));      // expiring
        store(mall, "B", 0, "OPEN", 50.0, "500.00", JAN, today.minusDays(5));        // expired, tenant still there
        store(mall, "C", 1, "VACANT", 80.0, "800.00", null, null);                    // vacant
        store(mall, "D", 1, "OPEN", 50.0, "600.00", JAN, null);                       // open-ended lease
        store(mall, "E", 1, "OPEN", null, null, JAN, today.plusDays(400));           // no rent, no surface
        String reports = assistant(mall, "VIEW_REPORTS");
        String noReports = assistant(mall, "MANAGE_STORES");

        JsonNode a = ok(call(get("/api/malls/" + mall.id() + "/analytics"), mall.manager(), null));
        assertEquals(5, a.get("totalUnits").asInt());
        assertEquals(4, a.get("leasedUnits").asInt());
        assertEquals(1, a.get("vacantUnits").asInt());
        assertEquals(80.0, a.get("occupancyRate").asDouble(), 0.001);
        assertEquals(2100.00, a.get("monthlyRent").asDouble(), 0.001);
        assertEquals(200.0, a.get("leasedSurface").asDouble(), 0.001, "only units with both a rent and a surface count");
        assertEquals(10.50, a.get("rentPerSqm").asDouble(), 0.001);
        assertEquals(800.00, a.get("vacantPotentialRent").asDouble(), 0.001);
        assertEquals(1, a.get("expiringSoon").asInt());
        assertEquals(1, a.get("expired").asInt());

        Map<String, String> states = new java.util.HashMap<>();
        a.get("units").forEach(u -> states.put(u.get("code").asText(), u.get("leaseState").asText()));
        assertEquals(Map.of("A", "EXPIRING", "B", "EXPIRED", "C", "VACANT", "D", "LEASED", "E", "LEASED"), states);
        assertEquals(30, a.get("units").get(0).get("daysLeft").asInt());

        JsonNode ground = a.get("floors").get(0);
        assertEquals(0, ground.get("level").asInt());
        assertEquals(2, ground.get("leased").asInt());
        assertEquals(10.00, ground.get("rentPerSqm").asDouble(), 0.001);
        JsonNode first = a.get("floors").get(1);
        assertEquals(1, first.get("level").asInt());
        assertEquals(66.7, first.get("occupancyRate").asDouble(), 0.001);
        assertEquals(1, first.get("vacant").asInt());

        // a store handed back is vacant at once
        long b = a.get("units").get(1).get("storeId").asLong();
        ok(call(put("/api/malls/" + mall.id() + "/stores/" + b), mall.manager(), Map.of("status", "VACANT")));
        assertEquals(2, ok(call(get("/api/malls/" + mall.id() + "/analytics"), mall.manager(), null)).get("vacantUnits").asInt());

        // permissions
        assertEquals(200, status(call(get("/api/malls/" + mall.id() + "/analytics"), reports, null)));
        assertEquals(403, status(call(get("/api/malls/" + mall.id() + "/analytics"), noReports, null)));
        assertEquals(403, status(call(get("/api/malls/" + mall.id() + "/analytics"), newUser("stranger", Role.MALL_USER), null)));
        assertEquals(401, status(call(get("/api/malls/" + mall.id() + "/analytics"), null, null)));
    }
}
