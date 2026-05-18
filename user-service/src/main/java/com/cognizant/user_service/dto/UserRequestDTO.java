package com.cognizant.user_service.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRequestDTO {

    private String name;
    private String role;
    private String email;
    private String phone;
    private Boolean mfaEnabled;
    private String status;
}
