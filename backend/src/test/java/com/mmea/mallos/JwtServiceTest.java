package com.mmea.mallos;

import com.mmea.mallos.config.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** The published development signing key must never be accepted by a production deployment. */
class JwtServiceTest {

    private static final String DEV_KEY = "dev-only-change-me-signing-key-32-bytes-minimum";
    private static final String REAL_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef";

    private static MockEnvironment profile(String name) {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles(name);
        return env;
    }

    @Test
    void theDevelopmentKeyIsRefusedInProduction() {
        assertThrows(IllegalStateException.class, () -> new JwtService(DEV_KEY, 1000, profile("prod")));
    }

    @Test
    void theDevelopmentKeyIsFineLocally() {
        assertDoesNotThrow(() -> new JwtService(DEV_KEY, 1000, profile("dev")));
    }

    @Test
    void aRealKeyIsAcceptedInProduction() {
        assertDoesNotThrow(() -> new JwtService(REAL_KEY, 1000, profile("prod")));
    }

    @Test
    void aTooShortKeyIsRefusedEverywhere() {
        assertThrows(RuntimeException.class, () -> new JwtService("short", 1000, profile("dev")));
    }
}
