package com.cognizant.hospease.security;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Forwards the caller's Authorization header (Bearer token) to every
 * downstream Feign call. Without this, downstream services see no token
 * and reject the call with 401/403.
 */
@Configuration
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
