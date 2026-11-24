package com.fpt.petstore.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.core.convert.converter.Converter;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * /api/** is an OAuth2 resource server: tokens are issued and validated by Keycloak (issuer-uri),
 * this app never issues tokens. Keycloak roles "customer" and "admin" become ROLE_CUSTOMER and ROLE_ADMIN.
 */
@Configuration
public class ApiSecurityConfig {

  @Bean
  @Order(1)
  SecurityFilterChain apiChain(HttpSecurity http, Converter<Jwt, AbstractAuthenticationToken> jwtConverter) throws Exception {
    http.securityMatcher("/api/**")
      .authorizeHttpRequests(a -> a
        .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
        .requestMatchers(HttpMethod.GET, "/api/v1/products/**", "/api/v1/foods/**").permitAll()
        .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
        .anyRequest().hasAnyRole("CUSTOMER", "ADMIN"))
      .oauth2ResourceServer(o -> o.jwt(j -> j.jwtAuthenticationConverter(jwtConverter)))
      .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .csrf(AbstractHttpConfigurer::disable)
      .cors(Customizer.withDefaults());
    return http.build();
  }

  @Bean
  Converter<Jwt, AbstractAuthenticationToken> keycloakJwtConverter(@Value("${petstore.keycloak.client-id}") String clientId) {
    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setPrincipalClaimName("preferred_username");
    converter.setJwtGrantedAuthoritiesConverter(jwt -> authorities(jwt, clientId));
    return converter;
  }

  @SuppressWarnings("unchecked")
  static Collection<GrantedAuthority> authorities(Jwt jwt, String clientId) {
    Set<String> roles = new LinkedHashSet<>();
    if (jwt.getClaim("realm_access") instanceof Map<?, ?> realm && realm.get("roles") instanceof List<?> list) {
      list.forEach(r -> roles.add(String.valueOf(r)));
    }
    if (jwt.getClaim("resource_access") instanceof Map<?, ?> clients && clients.get(clientId) instanceof Map<?, ?> client
      && ((Map<String, Object>) client).get("roles") instanceof List<?> list) {
      list.forEach(r -> roles.add(String.valueOf(r)));
    }
    Set<GrantedAuthority> authorities = new LinkedHashSet<>();
    roles.forEach(r -> authorities.add(new SimpleGrantedAuthority("ROLE_" + r.toUpperCase())));
    return authorities;
  }
}
