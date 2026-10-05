package com.mmea.mallos.config.security;

import com.mmea.mallos.user.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Issues and validates signed JWTs. The token only carries identity claims
 * (subject + role); authorization is re-derived from the database on every
 * request, so role changes and deactivations take effect immediately.
 */
@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${jwt.secret}") String secret,
                      @Value("${jwt.expiration-ms:86400000}") long expirationMs,
                      org.springframework.core.env.Environment environment) {
        // The repository ships a development key so that `docker compose up` works. Anything deployed
        // with the production profile must bring its own, otherwise tokens could be forged by anyone.
        if (environment.acceptsProfiles(org.springframework.core.env.Profiles.of("prod")) && secret.startsWith("dev-only")) {
            throw new IllegalStateException("JWT_SECRET is the published development key: set a real secret (openssl rand -hex 32)");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user) {
        Date now = new Date();
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("role", user.getRole().name())
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    /**
     * @return the parsed claims, or {@code null} when the token is invalid,
     *         expired or tampered with.
     */
    public Claims parseToken(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }
}