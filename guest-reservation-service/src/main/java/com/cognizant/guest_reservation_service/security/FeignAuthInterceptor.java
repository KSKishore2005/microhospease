package com.cognizant.guest_reservation_service.security;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * DEPRECATED — superseded by {@link com.cognizant.guest_reservation_service.config.FeignJwtInterceptor}.
 *
 * <p>This class is intentionally NOT a Spring bean (no @Component / @Configuration)
 * so it is not picked up by Spring's Feign interceptor scanner. Having two interceptors
 * register caused unpredictable double-header behaviour. Kept here only for diff history;
 * safe to delete after the new build ships.
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
