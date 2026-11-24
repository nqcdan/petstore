package com.fpt.petstore.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	// Legacy JSP site: authentication is handled by its own controllers/session, so Spring Security stays open here.
	@Bean
	SecurityFilterChain webChain(HttpSecurity http) throws Exception {
		http.authorizeHttpRequests(a -> a.anyRequest().permitAll())
			.csrf(AbstractHttpConfigurer::disable)
			.cors(Customizer.withDefaults())
			.headers(h -> h.frameOptions(f -> f.sameOrigin()));
		return http.build();
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource(CorsProperties cors) {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(cors.allowedOrigins());
		configuration.setAllowedHeaders(List.of("*"));
		configuration.setAllowedMethods(List.of("*"));
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
