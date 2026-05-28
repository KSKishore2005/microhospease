package com.hospease.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
@Slf4j
public class AuthenticationGatewayFilterFactory
        extends AbstractGatewayFilterFactory<AuthenticationGatewayFilterFactory.Config> {

    @Value("${app.jwt.secret}")
    private String secret;

    public AuthenticationGatewayFilterFactory() {
        super(Config.class);
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    /** Trusted header names downstream services read instead of re-parsing the JWT. */
    public static final String USER_HEADER = "X-Auth-User";
    public static final String ROLE_HEADER = "X-Auth-Role";
    public static final String USER_ID_HEADER = "X-Auth-User-Id";

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            HttpHeaders headers = exchange.getRequest().getHeaders();

            if (!headers.containsKey(HttpHeaders.AUTHORIZATION)) {
                log.warn("Missing Authorization header on path {}",
                        exchange.getRequest().getPath());
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            String authHeader = headers.getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }
            String token = authHeader.substring(7);

            final String email;
            final String role;
            final String userId;
            try {
                Claims claims = Jwts.parser()
                        .verifyWith(getSigningKey())
                        .build()
                        .parseSignedClaims(token)
                        .getPayload();

                // Explicit expiration check
                Date exp = claims.getExpiration();
                if (exp != null && exp.before(new Date())) {
                    log.warn("Expired JWT at gateway: expired at {}", exp);
                    exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                    return exchange.getResponse().setComplete();
                }

                email = claims.getSubject();
                role = claims.get("role", String.class);
                Object uid = claims.get("userId");
                userId = uid != null ? String.valueOf(uid) : "";

                log.debug("Gateway validated token for user '{}' role '{}'", email, role);
            } catch (ExpiredJwtException e) {
                log.warn("Expired JWT at gateway: {}", e.getMessage());
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            } catch (Exception e) {
                log.warn("Invalid JWT at gateway: {}", e.getMessage());
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            // Inject trusted X-Auth-* headers so downstream services don't have
            // to re-validate the JWT. CRITICAL: strip any inbound copies of
            // these headers FIRST so an attacker can't spoof their role by
            // sending `X-Auth-Role: ADMINISTRATOR` alongside a valid token.
            // Authorization is forwarded too so user-service can still echo it
            // back on /api/auth/refresh-token and similar self-introspection.
            final String authToForward = authHeader;
            return chain.filter(
                    exchange.mutate()
                            .request(r -> r
                                    // Remove any spoofed inbound copies before injecting our own.
                                    .headers(h -> {
                                        h.remove(USER_HEADER);
                                        h.remove(ROLE_HEADER);
                                        h.remove(USER_ID_HEADER);
                                    })
                                    .header(HttpHeaders.AUTHORIZATION, authToForward)
                                    .header(USER_HEADER, email == null ? "" : email)
                                    .header(ROLE_HEADER, role == null ? "" : role)
                                    .header(USER_ID_HEADER, userId))
                            .build()
            );
        };
    }

    public static class Config {
        // empty
    }
}
