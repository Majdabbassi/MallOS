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
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The team screen (members of a mall), assigning a manager from the admin screen, and tidy error answers. */
@SpringBootTest
@ActiveProfiles("test")
class TeamManagementIntegrationTest {

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
        String name = prefix + (++seq);
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
                        .content(json.writeValueAsString(Map.of("name", "Team mall " + seq, "companyName", "Co",
                                "address", "Somewhere", "taxId", "T-" + seq))))
                .andExpect(status().isCreated()).andReturn();
        String mallId = json.readTree(created.getResponse().getContentAsString()).get("id").asText();
        mvc.perform(post("/api/malls/" + mallId + "/managers").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("emailOrUsername", manager))))
                .andExpect(status().isCreated());
        return mallId;
    }

    private JsonNode members(String mallId, String user) throws Exception {
        MvcResult result = mvc.perform(get("/api/malls/" + mallId + "/members").header("Authorization", bearer(user)))
                .andExpect(status().isOk()).andReturn();
        return json.readTree(result.getResponse().getContentAsString());
    }

    private void invite(String mallId, String manager, String assistant) throws Exception {
        mvc.perform(post("/api/malls/" + mallId + "/assistants").header("Authorization", bearer(manager))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("emailOrUsername", assistant,
                                "permissions", List.of("VIEW_REPORTS")))))
                .andExpect(status().isCreated());
    }

    // ------------------------------------------------------------------ tests

    @Test
    void theManagerSeesTheirActiveTeamWithoutSecrets() throws Exception {
        String admin = newUser("admin", Role.SUPER_ADMIN);
        String manager = newUser("manager", Role.MALL_USER);
        String assistant = newUser("assistant", Role.MALL_USER);
        String mallId = mallWithManager(admin, manager);
        invite(mallId, manager, assistant);

        JsonNode team = members(mallId, manager);
        assertEquals(2, team.size());
        assertEquals("MANAGER", team.get(0).get("role").asText());
        assertEquals("ASSISTANT", team.get(1).get("role").asText());
        assertEquals(assistant + "@test.local", team.get(1).get("email").asText());
        assertFalse(team.toString().contains("password"), "no password field");
        assertFalse(team.toString().contains("$2a$"), "no password hash");
    }

    @Test
    void aRemovedAssistantLeavesTheList() throws Exception {
        String admin = newUser("admin", Role.SUPER_ADMIN);
        String manager = newUser("manager", Role.MALL_USER);
        String assistant = newUser("assistant", Role.MALL_USER);
        String mallId = mallWithManager(admin, manager);
        invite(mallId, manager, assistant);
        long assistantId = users.findByUsername(assistant).orElseThrow().getId();

        mvc.perform(delete("/api/malls/" + mallId + "/assistants/" + assistantId).header("Authorization", bearer(manager)))
                .andExpect(status().isNoContent());

        assertEquals(1, members(mallId, manager).size());
    }

    @Test
    void onlyTheMallsManagerOrAnAdminMayListTheTeam() throws Exception {
        String admin = newUser("admin", Role.SUPER_ADMIN);
        String manager = newUser("manager", Role.MALL_USER);
        String assistant = newUser("assistant", Role.MALL_USER);
        String otherManager = newUser("othermanager", Role.MALL_USER);
        String outsider = newUser("outsider", Role.MALL_USER);
        String mallId = mallWithManager(admin, manager);
        mallWithManager(admin, otherManager);
        invite(mallId, manager, assistant);

        for (String who : List.of(assistant, otherManager, outsider)) {
            mvc.perform(get("/api/malls/" + mallId + "/members").header("Authorization", bearer(who)))
                    .andExpect(status().isForbidden());
        }
        assertEquals(2, members(mallId, admin).size());
        mvc.perform(get("/api/malls/" + mallId + "/members")).andExpect(status().isUnauthorized());
    }

    @Test
    void anAdminAssignsAManagerByUsernameOrEmail() throws Exception {
        String admin = newUser("admin", Role.SUPER_ADMIN);
        String first = newUser("first", Role.MALL_USER);
        String second = newUser("second", Role.MALL_USER);
        String mallId = mallWithManager(admin, first);

        mvc.perform(post("/api/malls/" + mallId + "/managers").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("emailOrUsername", second + "@test.local"))))
                .andExpect(status().isCreated());
        assertEquals(2, members(mallId, admin).size());

        // already a member, unknown user, and a non-admin caller
        mvc.perform(post("/api/malls/" + mallId + "/managers").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("emailOrUsername", first))))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/malls/" + mallId + "/managers").header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("emailOrUsername", "nobody-here"))))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/malls/" + mallId + "/managers").header("Authorization", bearer(first))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("emailOrUsername", newUser("x", Role.MALL_USER)))))
                .andExpect(status().isForbidden());
    }

    // Regression: client mistakes used to answer 500 because a catch-all handler swallowed them.
    @Test
    void clientMistakesAreFourHundredsNotFiveHundreds() throws Exception {
        String admin = newUser("admin", Role.SUPER_ADMIN);
        String manager = newUser("manager", Role.MALL_USER);
        String mallId = mallWithManager(admin, manager);
        String token = bearer(manager);

        int notNumeric = mvc.perform(get("/api/malls/" + mallId + "/stores/abc").header("Authorization", token))
                .andReturn().getResponse().getStatus();
        int wrongContentType = mvc.perform(post("/api/malls/" + mallId + "/floors").header("Authorization", token)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"x\",\"level\":1}"))
                .andReturn().getResponse().getStatus();
        int unknownPath = mvc.perform(get("/api/does-not-exist").header("Authorization", token))
                .andReturn().getResponse().getStatus();

        assertEquals(400, notNumeric);
        assertEquals(415, wrongContentType);
        assertTrue(unknownPath == 404, "unknown path answered " + unknownPath);
    }
}
