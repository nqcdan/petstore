package com.fpt.petstore.api;

import com.fpt.petstore.api.Dto.AccountDto;
import com.fpt.petstore.api.Dto.AccountRequest;
import com.fpt.petstore.api.Dto.PageDto;
import com.fpt.petstore.entities.BaseAccount;
import com.fpt.petstore.entities.BaseAccount.UserRole;
import com.fpt.petstore.entities.Customer;
import com.fpt.petstore.entities.Employee;
import com.fpt.petstore.repository.CustomerRepository;
import com.fpt.petstore.repository.EmployeeRepository;
import com.fpt.petstore.repository.OrderRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

/** Admin CRUD for customer and employee profiles; credentials live in Keycloak, never here. */
@Service
@Transactional
public class AccountApiService {

  public enum Kind { CUSTOMER, EMPLOYEE }

  private final CustomerRepository customers;
  private final EmployeeRepository employees;
  private final OrderRepository orders;

  public AccountApiService(CustomerRepository customers, EmployeeRepository employees, OrderRepository orders) {
    this.customers = customers;
    this.employees = employees;
    this.orders = orders;
  }

  @Transactional(readOnly = true)
  public PageDto<AccountDto> list(Kind kind, String q, Pageable pageable) {
    Specification<BaseAccount> spec = Specs.containsAny(q, "username", "fullName", "email");
    Page<BaseAccount> page = specs(kind).findAll(spec, pageable);
    return new PageDto<>(page.map(this::toDto).getContent(), page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
  }

  @Transactional(readOnly = true)
  public AccountDto get(Kind kind, Long id) {
    return toDto(find(kind, id));
  }

  public AccountDto create(Kind kind, AccountRequest request) {
    if (exists(kind, request.username())) throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
    BaseAccount account = kind == Kind.CUSTOMER ? new Customer() : new Employee();
    account.setVerified(true);
    apply(account, request);
    return toDto(repo(kind).save(account));
  }

  public AccountDto update(Kind kind, Long id, AccountRequest request) {
    BaseAccount account = find(kind, id);
    if (!request.username().equals(account.getUsername()) && exists(kind, request.username())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
    }
    apply(account, request);
    return toDto(repo(kind).save(account));
  }

  public void delete(Kind kind, Long id) {
    BaseAccount account = find(kind, id);
    if (kind == Kind.CUSTOMER) orders.detachCustomer(id);
    else orders.detachEmployee(id);
    repo(kind).delete(account);
  }

  private void apply(BaseAccount a, AccountRequest r) {
    a.setUsername(r.username().trim());
    a.setFullName(r.fullName().trim());
    a.setEmail(r.email());
    a.setPhone(r.phone());
    a.setAddress(r.address());
    a.setGender(r.gender());
    a.setRole(r.role() != null ? r.role() : UserRole.Read);
    a.setBirthday(r.birthday() == null ? null : Date.from(r.birthday().atStartOfDay(ZoneId.systemDefault()).toInstant()));
  }

  private boolean exists(Kind kind, String username) {
    return kind == Kind.CUSTOMER ? customers.existsCustomersByUsername(username) : Boolean.TRUE.equals(employees.existsByUsername(username));
  }

  private BaseAccount find(Kind kind, Long id) {
    return repo(kind).findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, kind + " " + id + " not found"));
  }

  @SuppressWarnings("unchecked")
  private JpaRepository<BaseAccount, Long> repo(Kind kind) {
    return (JpaRepository<BaseAccount, Long>) (kind == Kind.CUSTOMER ? customers : employees);
  }

  @SuppressWarnings("unchecked")
  private JpaSpecificationExecutor<BaseAccount> specs(Kind kind) {
    return (JpaSpecificationExecutor<BaseAccount>) (kind == Kind.CUSTOMER ? customers : employees);
  }

  private AccountDto toDto(BaseAccount a) {
    LocalDate birthday = a.getBirthday() == null ? null : new java.sql.Date(a.getBirthday().getTime()).toLocalDate();
    return new AccountDto(a.getId(), a.getUsername(), a.getFullName(), a.getEmail(), a.getPhone(), a.getAddress(), a.getGender(),
      a.getRole(), birthday, a.isVerified());
  }
}
