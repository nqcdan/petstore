package com.fpt.petstore.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Product images are public under /api/v1/photos/catalog so a proxy only has to forward /api.
 * Customer avatars stay on /avatars, used only by the legacy JSP pages, and are not part of the API.
 */
@Configuration
public class MvcConfig implements WebMvcConfigurer {

    private final Path uploadDir;

    public MvcConfig(@Value("${petstore.upload-dir:user-photos}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/api/v1/photos/catalog/**").addResourceLocations("file:" + uploadDir.resolve("catalog") + "/");
        registry.addResourceHandler("/avatars/**").addResourceLocations("file:" + uploadDir.resolve("avatars") + "/");
    }
}
