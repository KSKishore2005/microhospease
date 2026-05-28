package com.cognizant.user_service.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * The entire local security setup for user-service in one file.
 *
 * <p>user-service is special: it ISSUES JWTs at {@code /api/auth/login} and
 * {@code /api/auth/register} (see {@link JwtTokenProvider}), but for incoming
 * /api/users/** and /api/audit-logs/** requests it trusts the gateway-injected
 * {@code X-Auth-User} / {@code X-Auth-Role} headers just like every other
 * service. The /api/auth/** routes remain public so login works.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    public static final String USER_HEADER = "X-Auth-User";
    public static final String ROLE_HEADER = "X-Auth-Role";
    public static final String USER_ID_HEADER = "X-Auth-User-Id";

    private final CustomUserDetailsService userDetailsService;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public HeaderAuthFilter headerAuthFilter() {
        return new HeaderAuthFilter();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s ->
                        s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/actuator/health",
                                "/actuator/info"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .headers(h -> h.frameOptions(f -> f.sameOrigin()))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(headerAuthFilter(),
                        UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    // ────────────────────────────────────────────────────────────────────────
    //  HeaderAuthFilter — reads gateway-trusted headers into SecurityContext
    // ────────────────────────────────────────────────────────────────────────
    @Slf4j
    public static class HeaderAuthFilter extends OncePerRequestFilter {
        @Override
        protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
            String path = request.getServletPath();
            return path.startsWith("/swagger-ui") || path.startsWith("/v3/api-docs");
        }

        @Override
        protected void doFilterInternal(@NonNull HttpServletRequest request,
                                        @NonNull HttpServletResponse response,
                                        @NonNull FilterChain chain) throws ServletException, IOException {
            String user = request.getHeader(USER_HEADER);
            String role = request.getHeader(ROLE_HEADER);

            if (user != null && !user.isBlank() && role != null && !role.isBlank()) {
                // Use the raw role string as the GrantedAuthority value so
                // Spring's @PreAuthorize("hasAuthority('ADMINISTRATOR')")
                // (which does NOT auto-prefix like hasRole does) matches.
                // This must match UserPrincipal.getAuthorities() format.
                UserDetails details = User.withUsername(user)
                        .password("")
                        .authorities(role)
                        .build();
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
                log.debug("Header-auth: user='{}' role='{}'", user, role);
            }
            chain.doFilter(request, response);
        }
    }
}
