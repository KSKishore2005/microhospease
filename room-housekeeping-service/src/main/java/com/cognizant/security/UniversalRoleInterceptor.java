package com.cognizant.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Arrays;

/**
 * Reads {@code @RoleRequired} on the target controller method and ensures
 * the authenticated user has one of the allowed roles.
 */
@Slf4j
public class UniversalRoleInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RoleRequired ann = handlerMethod.getMethodAnnotation(RoleRequired.class);
        if (ann == null) {
            // No annotation = no role enforcement; just JWT (handled by filter)
            return true;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || "anonymousUser".equals(auth.getPrincipal())) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED,
                    "Authentication required");
            return false;
        }

        String userRole = auth.getAuthorities().stream()
                .map(ga -> ga.getAuthority().replace("ROLE_", ""))
                .findFirst()
                .orElse(null);

        if (userRole == null) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN,
                    "User has no assigned role");
            return false;
        }

        String[] allowed = ann.value();
        if (!Arrays.asList(allowed).contains(userRole)) {
            log.warn("Access denied: role='{}' tried '{} {}', allowed={}",
                    userRole, request.getMethod(), request.getRequestURI(),
                    Arrays.toString(allowed));
            response.sendError(HttpServletResponse.SC_FORBIDDEN,
                    "Role '" + userRole + "' is not authorized. Required: "
                            + Arrays.toString(allowed));
            return false;
        }

        return true;
    }
}
