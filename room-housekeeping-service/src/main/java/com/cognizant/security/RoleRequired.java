package com.cognizant.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a controller method with the roles allowed to call it.
 * <p>
 * Example:
 * <pre>
 *   {@code @RoleRequired({"ADMINISTRATOR", "MANAGER"})}
 *   public ResponseEntity<...> createInvoice(...) { ... }
 * </pre>
 * <p>
 * Enforced by {@link UniversalRoleInterceptor}.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RoleRequired {
    String[] value();
}
