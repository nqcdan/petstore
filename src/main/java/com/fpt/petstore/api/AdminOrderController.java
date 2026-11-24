package com.fpt.petstore.api;

import com.fpt.petstore.api.Dto.OrderDetail;
import com.fpt.petstore.api.Dto.OrderSummary;
import com.fpt.petstore.api.Dto.PageDto;
import com.fpt.petstore.api.Dto.StateRequest;
import com.fpt.petstore.api.Dto.Stats;
import com.fpt.petstore.entities.Order.State;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

/** Admin order management and dashboard statistics. */
@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin orders")
@SecurityRequirement(name = "keycloak")
public class AdminOrderController {

  private final OrderApiService orders;

  public AdminOrderController(OrderApiService orders) {
    this.orders = orders;
  }

  @GetMapping("/orders")
  @Operation(summary = "List orders, filter by state (PAID, DUE, CANCEL) and free text on code or customer")
  public PageDto<OrderSummary> list(@RequestParam(required = false) State state, @RequestParam(required = false) String q,
                                    @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
    return orders.adminList(state, q, pageable);
  }

  @GetMapping("/orders/{id}")
  public OrderDetail get(@PathVariable Long id) {
    return orders.adminGet(id);
  }

  @PatchMapping("/orders/{id}/state")
  public OrderDetail setState(@PathVariable Long id, @Valid @RequestBody StateRequest request) {
    return orders.setState(id, request.state());
  }

  @GetMapping("/stats")
  @Operation(summary = "Revenue per day for the last 30 days (PAID orders), order counts by state, top products, customer total")
  public Stats stats() {
    return orders.stats();
  }
}
