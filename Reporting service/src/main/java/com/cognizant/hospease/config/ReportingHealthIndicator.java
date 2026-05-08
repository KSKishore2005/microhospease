package com.cognizant.hospease.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import java.io.File; // This is the most important import

@Component
public class ReportingHealthIndicator implements HealthIndicator {

    @Value("${report.storage.path}")
    private String path;

    @Override
    public Health health() {
        File reportDir = new File(path);

        // If the directory doesn't exist, try to create it automatically
        if (!reportDir.exists()) {
            reportDir.mkdirs();
        }

        if (reportDir.exists() && reportDir.isDirectory()) {
            return Health.up()
                    .withDetail("status", "Storage directory is ready")
                    .withDetail("location", reportDir.getAbsolutePath())
                    .build();
        } else {
            return Health.down()
                    .withDetail("Error", "Reports storage directory could not be accessed")
                    .build();
        }
    }
}