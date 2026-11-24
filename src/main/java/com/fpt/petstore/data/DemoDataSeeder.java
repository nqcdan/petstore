package com.fpt.petstore.data;

import com.fpt.petstore.entities.Customer;
import com.fpt.petstore.entities.Employee;
import com.fpt.petstore.entities.Order;
import com.fpt.petstore.entities.Order.PaymentMethod;
import com.fpt.petstore.entities.Order.State;
import com.fpt.petstore.services.PetStoreService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Random;

/**
 * Loads the legacy demo customers, employees and orders on an empty database.
 * The catalog (foods, products) comes from the Liquibase seed changesets instead.
 */
@Component
@ConditionalOnProperty(name = "petstore.seed.demo", havingValue = "true")
public class DemoDataSeeder implements CommandLineRunner {

  private final PetStoreService service;

  public DemoDataSeeder(PetStoreService service) {
    this.service = service;
  }

  @Override
  public void run(String... args) {
    if (!service.findAllCustomers().isEmpty()) return;
    PetStoreData data = new PetStoreData();
    for (Customer customer : data.ALL_CUSTOMERS) service.saveCustomer(customer);
    for (Employee employee : data.ALL_EMPLOYEES) service.saveEmployee(employee);
    for (Order order : spreadOverLastMonth(data.ALL_ORDERS)) service.saveOrder(order);
  }

  /**
   * The legacy orders carry 2020-21 dates and some have no state. Re-date them relative to now (last 30 days) and give
   * every one a state, so the admin dashboard looks alive on every start and after reset-demo.sh. Recent orders can
   * still be DUE, older ones are settled.
   */
  private Order[] spreadOverLastMonth(Order[] orders) {
    Random random = new Random(42);
    Instant now = Instant.now();
    for (Order order : orders) {
      int daysAgo = random.nextInt(30);
      Date when = Date.from(now.minus(daysAgo, ChronoUnit.DAYS).minus(random.nextInt(24 * 60), ChronoUnit.MINUTES));
      int roll = random.nextInt(100);
      boolean recent = daysAgo <= 4;
      order.setTransactionDate(when);
      order.setState(recent ? (roll < 45 ? State.PAID : roll < 90 ? State.DUE : State.CANCEL) : (roll < 85 ? State.PAID : State.CANCEL));
      order.setPaymentMethod(random.nextInt(100) < 60 ? PaymentMethod.COD : PaymentMethod.ATM);
      if (order.getPayments() != null) order.getPayments().forEach(p -> p.setTransactionDate(when));
    }
    return orders;
  }
}
