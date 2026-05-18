package com.cognizant.hospease.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

/**
 * Serves generated PDF reports as static resources at /reports/**
 * pointing to the local {@code report.storage.path} folder.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${report.storage.path}")
    private String reportPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        File file = new File(reportPath);
        String absolutePath = file.getAbsolutePath();

        if (!absolutePath.endsWith(File.separator)) {
            absolutePath += File.separator;
        }

        registry.addResourceHandler("/reports/**")
                .addResourceLocations("file:///" + absolutePath.replace("\\", "/"));
    }
}
