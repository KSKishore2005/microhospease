package com.cognizant.hospease.client.fallback;

import com.cognizant.hospease.client.UserServiceClient;
import com.cognizant.hospease.client.dto.UserDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * Fallback for UserServiceClient.
 * Returns null / empty list when user-service is unreachable or circuit is open.
 */
@Slf4j
@Component
public class UserServiceClientFallback implements UserServiceClient {

    @Override
    public UserDto getUserById(Long id) {
        log.warn("[FALLBACK] user-service unavailable — returning null for userId: {}", id);
        return null;
    }

    @Override
    public List<UserDto> getAllUsers() {
        log.warn("[FALLBACK] user-service unavailable — returning empty user list");
        return Collections.emptyList();
    }
}
