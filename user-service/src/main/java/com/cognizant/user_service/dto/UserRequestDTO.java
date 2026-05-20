package com.cognizant.user_service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRequestDTO {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    @NotBlank(message = "Role is required")
    @Pattern(regexp = "GUEST|FRONT_DESK_STAFF|HOUSEKEEPING_STAFF|RESTAURANT_SERVICE_STAFF|FINANCE_OFFICER|MANAGER|ADMINISTRATOR|AUDITOR",
             message = "Invalid role")
    private String role;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    /** plain-text on input; BCrypt-hashed before persistence. Optional on update. */
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private Boolean mfaEnabled;

    @Pattern(regexp = "ACTIVE|INACTIVE|SUSPENDED", message = "Invalid status")
    private String status;
}
