package com.cognizant.hospease.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.io.File;

@Component
public class ReportingHealthIndicator implements HealthIndicator {

    @Value("${report.storage.path}")
    private String path;

    @Override
    public Health health() {
        File reportDir = new File(path);
        if (!reportDir.exists()) {
            reportDir.mkdirs();
        }
        if (reportDir.exists() && reportDir.isDirectory()) {
            return Health.up()
                    .withDetail("status", "Storage directory is ready")
                    .withDetail("location", reportDir.getAbsolutePath())
                    .build();
        }
        return Health.down()
                .withDetail("Error", "Reports storage directory could not be accessed")
                .build();
    }
}
