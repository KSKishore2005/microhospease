package com.cognizant.user_service.service;

import com.cognizant.user_service.entity.User;
import com.cognizant.user_service.exception.ResourceNotFoundException;
import com.cognizant.user_service.repository.UserRepository;
import com.cognizant.user_service.security.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    public User createUser(User user) {
        return userRepository.save(user);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User updateUser(Long id, User userDetails) {
        User user = getUserById(id);
        
        String oldRole = user.getRole();
        user.setName(userDetails.getName());
        user.setRole(userDetails.getRole());
        user.setPhone(userDetails.getPhone());
        user.setMfaEnabled(userDetails.getMfaEnabled());
        user.setStatus(userDetails.getStatus());
        
        User updated = userRepository.save(user);

        // Audit Log
        String details = String.format("{\"updatedBy\":\"ADMINISTRATOR\", \"name\":\"%s\"}", user.getName());
        writeAuditLog(user.getUserId(), user.getName(), "UPDATE_USER", "USER", user.getUserId(), details);
        
        if (!oldRole.equalsIgnoreCase(user.getRole())) {
            writeAuditLog(user.getUserId(), user.getName(), "ROLE_CHANGE", "USER", user.getUserId(), 
                String.format("{\"old\":\"%s\", \"new\":\"%s\"}", oldRole, user.getRole()));
        }

        return updated;
    }

    public User enableMfa(Long id) {
        User user = getUserById(id);
        user.setMfaEnabled(true);
        User saved = userRepository.save(user);
        writeAuditLog(user.getUserId(), user.getName(), "ENABLE_MFA", "USER", user.getUserId(), "{}");
        return saved;
    }

    public User disableMfa(Long id) {
        User user = getUserById(id);
        user.setMfaEnabled(false);
        User saved = userRepository.save(user);
        writeAuditLog(user.getUserId(), user.getName(), "DISABLE_MFA", "USER", user.getUserId(), "{}");
        return saved;
    }

    public User assignRole(Long id, String roleName) {
        User user = getUserById(id);
        String oldRole = user.getRole();
        user.setRole(roleName.toUpperCase());
        User saved = userRepository.save(user);
        
        writeAuditLog(user.getUserId(), user.getName(), "ROLE_CHANGE", "USER", user.getUserId(), 
            String.format("{\"old\":\"%s\", \"new\":\"%s\"}", oldRole, user.getRole()));
        
        return saved;
    }

    private void writeAuditLog(Long userId, String userName, String action, String resourceType, Long resourceId, String details) {
        try {
            auditLogService.createAuditLog(userId, userName, action, resourceType, resourceId, details);
        } catch (Exception e) {
            System.err.println("Failed to write audit log: " + e.getMessage());
        }
    }

    public void deleteUser(Long id) {
        User user = getUserById(id);
        userRepository.delete(user);
    }
}
