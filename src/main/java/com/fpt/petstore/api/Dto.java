package com.fpt.petstore.api;

import com.fpt.petstore.entities.BaseAccount.Gender;
import com.fpt.petstore.entities.BaseAccount.UserRole;
import com.fpt.petstore.entities.Order;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Request and response shapes of the /api/v1 REST API. */
public final class Dto {
  private Dto() {}

  public record PageDto<T>(List<T> items, int page, int size, long totalItems, int totalPages) {}

  public record CatalogItem(Long id, String name, String sortName, int price, String imageUrl, String description, String type) {}

  public record CatalogItemRequest(
    @NotBlank @Size(max = 255) String name,
    @Size(max = 255) String sortName,
    @Min(0) int price,
    @Size(max = 32768) String description,
    @NotBlank String type) {}

  public record AccountDto(
    Long id, String username, String fullName, String email, String phone, String address,
    Gender gender, UserRole role, LocalDate birthday, boolean verified) {}

  public record AccountRequest(
    @NotBlank @Size(max = 255) String username,
    @NotBlank @Size(max = 255) String fullName,
    @Email String email,
    @Size(max = 255) String phone,
    @Size(max = 255) String address,
    Gender gender,
    UserRole role,
    LocalDate birthday) {}

  public record OrderItemDto(String name, String type, int quantity, int total) {}

  public record OrderSummary(
    Long id, String code, Order.State state, int total, String currency, Instant transactionDate, String customerName) {}

  public record OrderDetail(
    Long id, String code, Order.State state, int total, String currency, Instant transactionDate,
    String customerName, String customerUsername, String employeeUsername, String note, List<OrderItemDto> items) {}

  /** type is FOOD or PRODUCT. */
  public record CartLine(@NotBlank String type, @NotNull Long id, @Min(1) int quantity) {}

  public record OrderRequest(@NotEmpty List<@Valid CartLine> items, @Size(max = 1000) String note) {}

  public record Quote(List<OrderItemDto> items, int total, String currency) {}

  public record StateRequest(@NotNull Order.State state) {}

  public record DailyRevenue(LocalDate date, long orders, long revenue) {}

  public record StateCount(Order.State state, long count) {}

  public record TopItem(String name, long quantity, long revenue) {}

  /** Revenue counts PAID orders only. */
  public record Stats(List<DailyRevenue> revenueByDay, List<StateCount> ordersByState, List<TopItem> topProducts, long totalCustomers) {}

  public record Me(String subject, String username, String email, String name, List<String> roles) {}
}
