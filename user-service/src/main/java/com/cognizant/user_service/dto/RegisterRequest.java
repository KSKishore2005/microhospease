package com.cognizant.user_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for POST /api/auth/register.
 * Role must be one of: GUEST, FRONT_DESK_STAFF, HOUSEKEEPING_STAFF,
 * RESTAURANT_SERVICE_STAFF, FINANCE_OFFICER, MANAGER, ADMINISTRATOR, AUDITOR
 */
@Data
public class RegisterRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    /**
     * Optional; defaults to GUEST in AuthService. If provided, must be a known role
     * (note: the public /register endpoint silently downgrades to GUEST anyway —
     * see AuthService.SELF_REGISTERABLE_ROLES). The trailing pipe was removed from
     * the previous regex because it accidentally allowed empty strings to pass
     * validation, hiding malformed input from the client.
     */
    @Pattern(regexp = "GUEST|FRONT_DESK_STAFF|HOUSEKEEPING_STAFF|RESTAURANT_SERVICE_STAFF|FINANCE_OFFICER|MANAGER|ADMINISTRATOR|AUDITOR",
             message = "Invalid role")
    private String role;
}
