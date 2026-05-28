package com.cognizant.billing.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.util.Arrays;

/**
 * The entire local security setup for this service in one file.
 * <p>
 * The API Gateway validates the JWT and injects {@code X-Auth-User} +
 * {@code X-Auth-Role} headers. This service reads them via
 * {@link HeaderAuthFilter} into SecurityContextHolder, then
 * {@link RoleInterceptor} enforces {@link RoleRequired} on each controller
 * method. No JWT parsing happens here.
 */
@Slf4j
@Configuration
@EnableWebSecurity
public class SecurityConfig implements WebMvcConfigurer {

    public static final String USER_HEADER = "X-Auth-User";
    public static final String ROLE_HEADER = "X-Auth-Role";
    public static final String USER_ID_HEADER = "X-Auth-User-Id";

    @Bean
    public HeaderAuthFilter headerAuthFilter() {
        return new HeaderAuthFilter();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
                .addFilterBefore(headerAuthFilter(), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new RoleInterceptor())
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        "/swagger-ui/**", "/swagger-ui.html",
                        "/v3/api-docs/**", "/actuator/**");
    }

    @Slf4j
    public static class HeaderAuthFilter extends OncePerRequestFilter {
        @Override
        protected void doFilterInternal(HttpServletRequest request,
                                        HttpServletResponse response,
                                        FilterChain chain) throws ServletException, IOException {
            String user = request.getHeader(USER_HEADER);
            String role = request.getHeader(ROLE_HEADER);
            if (user != null && !user.isBlank() && role != null && !role.isBlank()) {
                // Raw role string (no ROLE_ prefix) — RoleInterceptor handles either form.
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

    @Slf4j
    public static class RoleInterceptor implements HandlerInterceptor {
        @Override
        public boolean preHandle(HttpServletRequest request,
                                 HttpServletResponse response,
                                 Object handler) throws Exception {
            if (!(handler instanceof HandlerMethod hm)) return true;
            RoleRequired ann = hm.getMethodAnnotation(RoleRequired.class);
            if (ann == null) return true;

            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()
                    || "anonymousUser".equals(auth.getPrincipal())) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication required");
                return false;
            }

            String userRole = auth.getAuthorities().stream()
                    .map(ga -> ga.getAuthority().replace("ROLE_", ""))
                    .findFirst()
                    .orElse(null);

            if (userRole == null || !Arrays.asList(ann.value()).contains(userRole)) {
                log.warn("Access denied: role='{}' {} {} allowed={}",
                        userRole, request.getMethod(), request.getRequestURI(),
                        Arrays.toString(ann.value()));
                response.sendError(HttpServletResponse.SC_FORBIDDEN,
                        "Role '" + userRole + "' is not authorized. Required: "
                                + Arrays.toString(ann.value()));
                return false;
            }
            return true;
        }
    }
}
