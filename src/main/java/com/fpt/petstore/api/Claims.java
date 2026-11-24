package com.fpt.petstore.api;

import org.springframework.security.oauth2.jwt.Jwt;

final class Claims {
  private Claims() {}

  static String username(Jwt jwt) {
    String username = jwt.getClaimAsString("preferred_username");
    return username != null ? username : jwt.getSubject();
  }
}
