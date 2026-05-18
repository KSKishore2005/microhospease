package com.cognizant.user_service.config;

import com.cognizant.user_service.entity.User;
import com.cognizant.user_service.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seed("admin@hospease.com",        "Admin Root",       "Admin@123",      "ADMINISTRATOR");
        seed("manager@hospease.com",      "Manager User",     "Manager@123",    "MANAGER");
        seed("frontdesk@hospease.com",    "Front Desk Staff", "Front@123",      "FRONT_DESK_STAFF");
        seed("finance@hospease.com",      "Finance Officer",  "Finance@123",    "FINANCE_OFFICER");
        seed("housekeeping@hospease.com", "Housekeeper",      "House@123",      "HOUSEKEEPING_STAFF");
        seed("auditor@hospease.com",      "Auditor",          "Auditor@123",    "AUDITOR");
    }

    private void seed(String email, String name, String password, String role) {
        if (userRepository.findByEmail(email).isPresent()) return;
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPhone("9000000000");
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setMfaEnabled(false);
        user.setStatus("ACTIVE");
        userRepository.save(user);
        log.info("Seeded user: {} ({})", email, role);
    }
}