package com.fpt.petstore.api;

import com.fpt.petstore.api.Dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Signed-in shopper: profile from the token, cart pricing and own orders. The cart itself lives in the client. */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Shop")
@SecurityRequirement(name = "keycloak")
public class ShopController {

  private final OrderApiService orders;

  public ShopController(OrderApiService orders) {
    this.orders = orders;
  }

  @GetMapping("/me")
  @Operation(summary = "Identity and roles taken from the access token")
  public Me me(@AuthenticationPrincipal Jwt jwt, Authentication authentication) {
    List<String> roles = authentication.getAuthorities().stream()
      .map(a -> a.getAuthority().substring("ROLE_".length()).toLowerCase()).toList();
    return new Me(jwt.getSubject(), Claims.username(jwt), jwt.getClaimAsString("email"), jwt.getClaimAsString("name"), roles);
  }

  @PostMapping("/cart/quote")
  @Operation(summary = "Price a cart with catalog prices")
  public Quote quote(@Valid @RequestBody OrderRequest request) {
    return orders.quote(request.items());
  }

  @PostMapping("/orders")
  @ResponseStatus(HttpStatus.CREATED)
  @Operation(summary = "Place an order for the signed-in user (state DUE)")
  public OrderDetail place(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody OrderRequest request) {
    return orders.place(jwt, request);
  }

  @GetMapping("/orders")
  @Operation(summary = "Own orders, newest first by default")
  public PageDto<OrderSummary> mine(@AuthenticationPrincipal Jwt jwt, @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
    return orders.mine(Claims.username(jwt), pageable);
  }

  @GetMapping("/orders/{code}")
  public OrderDetail mine(@AuthenticationPrincipal Jwt jwt, @PathVariable String code) {
    return orders.mineByCode(Claims.username(jwt), code);
  }
}
