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
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    /**
     * Roles a user is allowed to self-assign via the public /register endpoint.
     * Privileged roles (ADMINISTRATOR, MANAGER, etc.) can only be assigned by an
     * existing administrator through POST /api/users or POST /api/users/{id}/assign-role.
     */
    private static final Set<String> SELF_REGISTERABLE_ROLES = Set.of("GUEST");

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

        // The public /register endpoint can only create GUEST accounts. If a request
        // sneaks in a privileged role (ADMINISTRATOR, MANAGER, …), silently coerce
        // it down to GUEST rather than handing out admin to anyone who asks.
        String requested = request.getRole() != null ? request.getRole().toUpperCase() : "";
        String role = SELF_REGISTERABLE_ROLES.contains(requested) ? requested : "GUEST";
        if (!requested.isBlank() && !role.equals(requested)) {
            log.warn("Rejected self-register role '{}' for email {}, defaulting to GUEST",
                    requested, request.getEmail());
        }

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

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with email: " + request.getEmail()));

        // Reject disabled accounts explicitly BEFORE minting a token. Spring's
        // DaoAuthenticationProvider doesn't call isEnabled() reliably for every
        // configuration, so the JWT could otherwise be issued to an INACTIVE user
        // and only get rejected later at validate/refresh time.
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("Account is not active.");
        }

        String token = jwtTokenProvider.generateToken(principal);

        writeAuditLog(user.getUserId(), user.getName(),
                "LOGIN", "USER", user.getUserId());

        return buildResponse(token, user);
    }

    public TokenValidationResponse validateToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        if (!jwtTokenProvider.validateToken(token)) {
            return TokenValidationResponse.builder().valid(false).build();
        }

        String email = jwtTokenProvider.getEmailFromToken(token);
        User user = userRepository.findByEmail(email).orElse(null);

        // Token is cryptographically valid but the underlying user has been
        // deleted or disabled — reject so admins can revoke access immediately
        // without waiting for token expiry.
        if (user == null || !"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            return TokenValidationResponse.builder().valid(false).build();
        }

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

        // Disabled accounts must not be able to mint fresh tokens from a stale one.
        if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("Account is not active.");
        }

        UserPrincipal principal = new UserPrincipal(user);
        String newToken = jwtTokenProvider.generateToken(principal);

        writeAuditLog(user.getUserId(), user.getName(),
                "REFRESH_TOKEN", "USER", user.getUserId());

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
            // Never let an audit-log failure break login/register/refresh.
            log.warn("Audit log failed for userId={} action={}: {}", userId, action, e.getMessage());
        }
    }
}





