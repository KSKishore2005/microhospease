package com.cognizant.hospease.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Forwards the trusted X-Auth-User / X-Auth-Role / X-Auth-User-Id headers
 * (originally injected by the API gateway) onto outgoing Feign calls so the
 * downstream service's HeaderAuthFilter can re-populate SecurityContext.
 *
 * <p>The Authorization header is also forwarded for backward compatibility
 * during the transition away from in-service JWT validation.
 */
@Component
public class FeignJwtInterceptor implements RequestInterceptor {

    private static final String USER_HEADER = "X-Auth-User";
    private static final String ROLE_HEADER = "X-Auth-Role";
    private static final String USER_ID_HEADER = "X-Auth-User-Id";

    @Override
    public void apply(RequestTemplate template) {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attributes == null) return;

        HttpServletRequest request = attributes.getRequest();

        forward(template, request, USER_HEADER);
        forward(template, request, ROLE_HEADER);
        forward(template, request, USER_ID_HEADER);

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            template.header("Authorization", authHeader);
        }
    }

    private static void forward(RequestTemplate template, HttpServletRequest request, String name) {
        String value = request.getHeader(name);
        if (value != null && !value.isBlank()) {
            template.header(name, value);
        }
    }
}
