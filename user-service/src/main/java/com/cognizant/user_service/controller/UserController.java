package com.cognizant.user_service.controller;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cognizant.user_service.dto.UserRequestDTO;
import com.cognizant.user_service.dto.UserResponseDTO;
import com.cognizant.user_service.entity.User;
import com.cognizant.user_service.security.Role;
import com.cognizant.user_service.service.UserService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<UserResponseDTO> createUser(@RequestBody UserRequestDTO userRequestDTO) {
        User user = mapToEntity(userRequestDTO);
        User savedUser = userService.createUser(user);
        return new ResponseEntity<>(mapToResponseDTO(savedUser), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATOR','AUDITOR')")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(mapToResponseDTO(userService.getUserById(id)));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATOR','AUDITOR')")
    public ResponseEntity<UserResponseDTO> getUserByEmail(@PathVariable String email) {
        return ResponseEntity.ok(mapToResponseDTO(userService.getUserByEmail(email)));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMINISTRATOR','AUDITOR')")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<UserResponseDTO> responseDTOs = users.stream().map(this::mapToResponseDTO).collect(Collectors.toList());
        return ResponseEntity.ok(responseDTOs);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<UserResponseDTO> updateUser(@PathVariable Long id, @RequestBody UserRequestDTO userRequestDTO) {
        User user = mapToEntity(userRequestDTO);
        User updatedUser = userService.updateUser(id, user);
        return ResponseEntity.ok(mapToResponseDTO(updatedUser));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/enable-mfa")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or #id == authentication.principal.userId")
    public ResponseEntity<UserResponseDTO> enableMfa(@PathVariable Long id) {
        return ResponseEntity.ok(mapToResponseDTO(userService.enableMfa(id)));
    }

    @PostMapping("/{id}/disable-mfa")
    @PreAuthorize("hasAuthority('ADMINISTRATOR') or #id == authentication.principal.userId")
    public ResponseEntity<UserResponseDTO> disableMfa(@PathVariable Long id) {
        return ResponseEntity.ok(mapToResponseDTO(userService.disableMfa(id)));
    }

    @GetMapping("/roles")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<List<String>> getRoles() {
        return ResponseEntity.ok(Arrays.stream(Role.values()).map(Enum::name).collect(Collectors.toList()));
    }

    @PostMapping("/{id}/assign-role")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<UserResponseDTO> assignRole(@PathVariable Long id, @RequestParam String role) {
        return ResponseEntity.ok(mapToResponseDTO(userService.assignRole(id, role)));
    }

    private User mapToEntity(UserRequestDTO dto) {
        User user = new User();
        user.setName(dto.getName());
        user.setRole(dto.getRole());
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setMfaEnabled(dto.getMfaEnabled());
        user.setStatus(dto.getStatus());
        return user;
    }

    private UserResponseDTO mapToResponseDTO(User user) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setUserId(user.getUserId());
        dto.setName(user.getName());
        dto.setRole(user.getRole());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setMfaEnabled(user.getMfaEnabled());
        dto.setStatus(user.getStatus());
        return dto;
    }
}
