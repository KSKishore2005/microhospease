package com.cognizant.hospease.client;

import com.cognizant.hospease.client.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Calls user-service to validate staff identity for report creation.
 */
@FeignClient(
        name = "user-service",
        url = "${user-service.url:}"
)
public interface UserServiceClient {

    @GetMapping("/api/users/{id}")
    UserDto getUserById(@PathVariable("id") Long id);
}
