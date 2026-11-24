package com.fpt.petstore.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/** Serves uploaded product images and avatars under /api/v1/photos so a proxy only has to forward /api. */
@Configuration
public class MvcConfig implements WebMvcConfigurer {

    private final String uploadDir;

    public MvcConfig(@Value("${petstore.upload-dir:user-photos}") String uploadDir) {
        this.uploadDir = uploadDir;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/api/v1/photos/**")
            .addResourceLocations("file:" + Paths.get(uploadDir).toAbsolutePath() + "/");
    }
}
