package com.cognizant.user_service.service;

import com.cognizant.user_service.dto.AuthResponse;
import com.cognizant.user_service.dto.LoginRequest;
import com.cognizant.user_service.dto.RegisterRequest;
import com.cognizant.user_service.dto.TokenValidationResponse;
import com.cognizant.user_service.entity.User;
import com.cognizant.user_service.exception.ResourceNotFoundException;
import com.cognizant.user_service.repository.UserRepository;
import com.cognizant.user_service.security.JwtTokenProvider;
import com.cognizant.user_service.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService; // ✅ FIXED
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException(
                    "Email is already registered: " + request.getEmail());
        }

        String role = (request.getRole() != null && !request.getRole().isBlank())
                ? request.getRole().toUpperCase()
                : "GUEST";

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setMfaEnabled(false);
        user.setStatus("ACTIVE");

        User savedUser = userRepository.save(user);

        UserPrincipal principal = new UserPrincipal(savedUser);
        String token = jwtTokenProvider.generateToken(principal);

        // ✅ LOG (DECOUPLED)
        writeAuditLog(savedUser.getUserId(), savedUser.getName(),
                "REGISTER", "USER", savedUser.getUserId());

        return buildResponse(token, savedUser);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), request.getPassword()));

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(principal);

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with email: " + request.getEmail()));

        // ✅ LOG (DECOUPLED)
        writeAuditLog(user.getUserId(), user.getName(),
                "LOGIN", "USER", user.getUserId());

        return buildResponse(token, user);
    }

    public TokenValidationResponse validateToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        boolean isValid = jwtTokenProvider.validateToken(token);
        if (!isValid) {
            return TokenValidationResponse.builder().valid(false).build();
        }

        String email = jwtTokenProvider.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        return TokenValidationResponse.builder()
                .valid(true)
                .userId(user.getUserId())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    public void logout(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        try {
            String email = jwtTokenProvider.getEmailFromToken(token);
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                writeAuditLog(user.getUserId(), user.getName(), "LOGOUT", "USER", user.getUserId());
            }
        } catch (Exception e) {
            // Silently fail if token is already invalid
        }
    }

    public AuthResponse refreshToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        if (!jwtTokenProvider.validateToken(token)) {
            throw new IllegalArgumentException("Invalid token for refresh");
        }

        String email = jwtTokenProvider.getEmailFromToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        UserPrincipal principal = new UserPrincipal(user);
        String newToken = jwtTokenProvider.generateToken(principal);

        return buildResponse(newToken, user);
    }

    private AuthResponse buildResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .expiresIn(jwtExpirationMs)
                .build();
    }

    // ✅ FIXED METHOD
    private void writeAuditLog(Long userId, String userName,
                              String action, String resourceType,
                              Long resourceId) {

        try {
            auditLogService.createAuditLog(
                    userId,
                    userName,
                    action,
                    resourceType,
                    resourceId,
                    "{\"source\":\"AuthService\"}"
            );
        } catch (Exception e) {
            // 🔥 VERY IMPORTANT: do not break login/register
            System.out.println("Audit log failed: " + e.getMessage());
        }
    }
}





