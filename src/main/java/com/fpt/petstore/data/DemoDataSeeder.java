package com.fpt.petstore.data;

import com.fpt.petstore.entities.Customer;
import com.fpt.petstore.entities.Employee;
import com.fpt.petstore.entities.Order;
import com.fpt.petstore.services.PetStoreService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

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
    for (Order order : data.ALL_ORDERS) service.saveOrder(order);
  }
}
