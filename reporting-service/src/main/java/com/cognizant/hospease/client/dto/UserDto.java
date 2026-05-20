package com.cognizant.hospease.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserDto {
    private Long userId;
    private String name;
    private String email;
    private String role;
    private String status;

    /** Frontend reads staff?.id — mirror userId so the field resolves. */
    public Long getId() { return userId; }
}
