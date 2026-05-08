package com.cognizant.hospease.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${report.storage.path}")
    private String reportPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        File file = new File(reportPath);
        String absolutePath = file.getAbsolutePath();

        // Ensure the path ends with a separator for Spring to treat it as a directory
        if (!absolutePath.endsWith(File.separator)) {
            absolutePath += File.separator;
        }

        registry.addResourceHandler("/reports/**")
                .addResourceLocations("file:///" + absolutePath.replace("\\", "/"));
    }
}