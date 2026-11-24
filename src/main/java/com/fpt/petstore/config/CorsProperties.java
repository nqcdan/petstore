package com.fpt.petstore.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties("petstore.cors")
public record CorsProperties(List<String> allowedOrigins) {
}
