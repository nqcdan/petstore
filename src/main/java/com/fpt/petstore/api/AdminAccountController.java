package com.fpt.petstore.api;

import com.fpt.petstore.api.AccountApiService.Kind;
import com.fpt.petstore.api.Dto.AccountDto;
import com.fpt.petstore.api.Dto.AccountRequest;
import com.fpt.petstore.api.Dto.PageDto;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/** Admin CRUD for customer and employee profiles. */
@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin accounts")
@SecurityRequirement(name = "keycloak")
public class AdminAccountController {

  private final AccountApiService accounts;

  public AdminAccountController(AccountApiService accounts) {
    this.accounts = accounts;
  }

  @GetMapping("/customers")
  public PageDto<AccountDto> customers(@RequestParam(required = false) String q, @PageableDefault(size = 20, sort = "id") Pageable pageable) {
    return accounts.list(Kind.CUSTOMER, q, pageable);
  }

  @GetMapping("/customers/{id}")
  public AccountDto customer(@PathVariable Long id) {
    return accounts.get(Kind.CUSTOMER, id);
  }

  @PostMapping("/customers")
  @ResponseStatus(HttpStatus.CREATED)
  public AccountDto createCustomer(@Valid @RequestBody AccountRequest request) {
    return accounts.create(Kind.CUSTOMER, request);
  }

  @PutMapping("/customers/{id}")
  public AccountDto updateCustomer(@PathVariable Long id, @Valid @RequestBody AccountRequest request) {
    return accounts.update(Kind.CUSTOMER, id, request);
  }

  @DeleteMapping("/customers/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteCustomer(@PathVariable Long id) {
    accounts.delete(Kind.CUSTOMER, id);
  }

  @GetMapping("/employees")
  public PageDto<AccountDto> employees(@RequestParam(required = false) String q, @PageableDefault(size = 20, sort = "id") Pageable pageable) {
    return accounts.list(Kind.EMPLOYEE, q, pageable);
  }

  @GetMapping("/employees/{id}")
  public AccountDto employee(@PathVariable Long id) {
    return accounts.get(Kind.EMPLOYEE, id);
  }

  @PostMapping("/employees")
  @ResponseStatus(HttpStatus.CREATED)
  public AccountDto createEmployee(@Valid @RequestBody AccountRequest request) {
    return accounts.create(Kind.EMPLOYEE, request);
  }

  @PutMapping("/employees/{id}")
  public AccountDto updateEmployee(@PathVariable Long id, @Valid @RequestBody AccountRequest request) {
    return accounts.update(Kind.EMPLOYEE, id, request);
  }

  @DeleteMapping("/employees/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteEmployee(@PathVariable Long id) {
    accounts.delete(Kind.EMPLOYEE, id);
  }
}
