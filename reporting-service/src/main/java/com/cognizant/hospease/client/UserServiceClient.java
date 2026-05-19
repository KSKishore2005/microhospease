package com.cognizant.hospease.client;

import com.cognizant.hospease.client.dto.UserDto;
import com.cognizant.hospease.client.fallback.UserServiceClientFallback;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

/**
 * Calls user-service to validate staff identity and fetch staff data.
 * Falls back to UserServiceClientFallback when the circuit is open or the service is unreachable.
 */
@FeignClient(
        name = "user-service",
        url = "${user-service.url:}",
        fallback = UserServiceClientFallback.class
)
public interface UserServiceClient {

    @GetMapping("/api/users/{id}")
    UserDto getUserById(@PathVariable("id") Long id);

    @GetMapping("/api/users")
    List<UserDto> getAllUsers();
}
