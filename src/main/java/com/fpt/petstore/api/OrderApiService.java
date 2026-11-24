package com.fpt.petstore.api;

import com.fpt.petstore.api.Dto.*;
import com.fpt.petstore.entities.BaseAccount.UserRole;
import com.fpt.petstore.entities.Customer;
import com.fpt.petstore.entities.Food;
import com.fpt.petstore.entities.Order;
import com.fpt.petstore.entities.Order.PaymentMethod;
import com.fpt.petstore.entities.Order.State;
import com.fpt.petstore.entities.OrderItem;
import com.fpt.petstore.entities.OrderItem.ItemType;
import com.fpt.petstore.entities.Product;
import com.fpt.petstore.repository.CustomerRepository;
import com.fpt.petstore.repository.FoodRepository;
import com.fpt.petstore.repository.OrderRepository;
import com.fpt.petstore.repository.ProductsRepository;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Cart pricing, order placement, order administration and dashboard statistics. */
@Service
@Transactional
public class OrderApiService {

  private static final String CURRENCY = "VND";
  private static final int STATS_DAYS = 30;

  private final OrderRepository orders;
  private final CustomerRepository customers;
  private final FoodRepository foods;
  private final ProductsRepository products;

  public OrderApiService(OrderRepository orders, CustomerRepository customers, FoodRepository foods, ProductsRepository products) {
    this.orders = orders;
    this.customers = customers;
    this.foods = foods;
    this.products = products;
  }

  // Shopper side

  @Transactional(readOnly = true)
  public Quote quote(List<CartLine> lines) {
    List<OrderItem> items = priceLines(lines);
    return new Quote(items.stream().map(this::toItem).toList(), items.stream().mapToInt(OrderItem::getTotal).sum(), CURRENCY);
  }

  public OrderDetail place(Jwt jwt, OrderRequest request) {
    Customer customer = customerOf(jwt);
    List<OrderItem> items = priceLines(request.items());
    Order order = new Order("OD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
    order.withCustomer(customer).withState(State.DUE);
    order.setPaymentMethod(request.paymentMethod() != null ? request.paymentMethod() : PaymentMethod.COD);
    order.setTransactionDate(new Date());
    order.setOrderItems(items);
    order.setTotal(items.stream().mapToInt(OrderItem::getTotal).sum());
    if (request.note() != null && !request.note().isBlank()) order.setNote(request.note().trim());
    return toDetail(orders.save(order));
  }

  @Transactional(readOnly = true)
  public PageDto<OrderSummary> mine(String username, Pageable pageable) {
    return toPage(orders.findByCustomerUsername(username, pageable));
  }

  @Transactional(readOnly = true)
  public OrderDetail mineByCode(String username, String code) {
    return toDetail(orders.findByCodeAndCustomerUsername(code, username)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order " + code + " not found")));
  }

  // Admin side

  @Transactional(readOnly = true)
  public PageDto<OrderSummary> adminList(State state, String q, Pageable pageable) {
    Specification<Order> search = (root, query, cb) -> {
      if (q == null || q.isBlank()) return null;
      var customer = root.join("customer", JoinType.LEFT);
      String pattern = "%" + q.trim().toLowerCase() + "%";
      return cb.or(cb.like(cb.lower(root.get("code")), pattern), cb.like(cb.lower(customer.get("fullName")), pattern),
        cb.like(cb.lower(customer.get("username")), pattern));
    };
    return toPage(orders.findAll(Specification.where(Specs.<Order>equalTo("state", state)).and(search), pageable));
  }

  @Transactional(readOnly = true)
  public OrderDetail adminGet(Long id) {
    return toDetail(find(id));
  }

  public OrderDetail setState(Long id, State state) {
    Order order = find(id);
    order.setState(state);
    return toDetail(orders.save(order));
  }

  @Transactional(readOnly = true)
  public Stats stats() {
    ZoneId zone = ZoneId.systemDefault();
    LocalDate today = LocalDate.now(zone);
    LocalDate first = today.minusDays(STATS_DAYS - 1);
    Map<LocalDate, DailyRevenue> byDay = new LinkedHashMap<>();
    for (LocalDate d = first; !d.isAfter(today); d = d.plusDays(1)) byDay.put(d, new DailyRevenue(d, 0, 0));
    for (Object[] row : orders.dailyRevenue(State.PAID, Date.from(first.atStartOfDay(zone).toInstant()))) {
      LocalDate day = toLocalDate(row[0]);
      byDay.put(day, new DailyRevenue(day, ((Number) row[1]).longValue(), ((Number) row[2]).longValue()));
    }
    List<StateCount> byState = orders.countByState().stream().map(r -> new StateCount((State) r[0], ((Number) r[1]).longValue())).toList();
    List<TopItem> top = orders.topItems(State.PAID, PageRequest.of(0, 5)).stream()
      .map(r -> new TopItem((String) r[0], ((Number) r[1]).longValue(), ((Number) r[2]).longValue())).toList();
    return new Stats(new ArrayList<>(byDay.values()), byState, top, customers.count());
  }

  // Helpers

  private Order find(Long id) {
    return orders.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order " + id + " not found"));
  }

  /** Prices come from the catalog, never from the client; repeated lines are merged. */
  private List<OrderItem> priceLines(List<CartLine> lines) {
    Map<String, Integer> merged = new LinkedHashMap<>();
    for (CartLine line : lines) merged.merge(line.type().toUpperCase() + ":" + line.id(), line.quantity(), Integer::sum);
    List<OrderItem> items = new ArrayList<>();
    merged.forEach((key, quantity) -> {
      String[] parts = key.split(":");
      Long id = Long.valueOf(parts[1]);
      OrderItem item = switch (parts[0]) {
        case "FOOD" -> new OrderItem().newOrderItem(foods.findById(id).orElseThrow(() -> unknown("Food", id)));
        case "PRODUCT" -> new OrderItem().newOrderItem(products.findById(id).orElseThrow(() -> unknown("Product", id)));
        default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "type must be FOOD or PRODUCT");
      };
      int unitPrice = item.getTotal();
      item.setQuantity(quantity);
      item.setTotal(unitPrice * quantity);
      items.add(item);
    });
    return items;
  }

  private ResponseStatusException unknown(String what, Long id) {
    return new ResponseStatusException(HttpStatus.BAD_REQUEST, what + " " + id + " does not exist");
  }

  /** Keycloak users get a local customer row on their first order, so orders keep their foreign key. */
  private Customer customerOf(Jwt jwt) {
    String username = Claims.username(jwt);
    Customer existing = customers.findByUsername(username);
    if (existing != null) return existing;
    Customer customer = new Customer(jwt.getClaimAsString("name") != null ? jwt.getClaimAsString("name") : username);
    customer.setUsername(username);
    customer.setEmail(jwt.getClaimAsString("email"));
    customer.setRole(UserRole.Read);
    customer.setVerified(true);
    return customers.save(customer);
  }

  private static LocalDate toLocalDate(Object value) {
    if (value instanceof LocalDate d) return d;
    return ((java.sql.Date) value).toLocalDate();
  }

  private OrderItemDto toItem(OrderItem i) {
    return new OrderItemDto(i.getName(), String.valueOf(i.getType()), i.getQuantity(), i.getTotal());
  }

  private PageDto<OrderSummary> toPage(Page<Order> page) {
    List<OrderSummary> items = page.getContent().stream().map(o -> new OrderSummary(o.getId(), o.getCode(), o.getState(), o.getTotal(),
      o.getCurrency(), o.getTransactionDate() == null ? null : o.getTransactionDate().toInstant(),
      o.getCustomer() == null ? null : o.getCustomer().getFullName(), o.getPaymentMethod())).toList();
    return new PageDto<>(items, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
  }

  private OrderDetail toDetail(Order o) {
    List<OrderItemDto> items = o.getOrderItems() == null ? List.of() : o.getOrderItems().stream().map(this::toItem).toList();
    Customer c = o.getCustomer();
    return new OrderDetail(o.getId(), o.getCode(), o.getState(), o.getTotal(), o.getCurrency(),
      o.getTransactionDate() == null ? null : o.getTransactionDate().toInstant(),
      c == null ? null : c.getFullName(), c == null ? null : c.getUsername(),
      o.getEmployee() == null ? null : o.getEmployee().getUsername(), o.getPaymentMethod(), o.getNote(), items);
  }
}
