package com.cognizant.services_service.security;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * DEPRECATED — superseded by {@link com.cognizant.services_service.config.FeignJwtInterceptor}.
 * Intentionally NOT a Spring bean to prevent double registration with FeignJwtInterceptor.
 */
public class FeignAuthInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) return;
        HttpServletRequest req = attrs.getRequest();
        String authHeader = req.getHeader("Authorization");
        if (authHeader != null && !authHeader.isBlank()) {
            template.header("Authorization", authHeader);
        }
    }
}
