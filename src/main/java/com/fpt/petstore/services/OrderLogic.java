package com.fpt.petstore.services;

import com.fpt.petstore.entities.Customer;
import com.fpt.petstore.entities.Employee;
import com.fpt.petstore.entities.Order;
import com.fpt.petstore.entities.OrderItem;
import com.fpt.petstore.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;


/**
 * @author linuss
 */

@Component
public class OrderLogic {

  @Autowired
  OrderRepository repo;

  public Order saveOrder(Order order) {
  	int total = 0;
    List<OrderItem> items = order.getOrderItems();
    if(items != null) {
    	for(OrderItem item: items) {
    	  total += item.getTotal();
      }
    	order.setTotal(total);
    }
    return repo.save(order);
  }

  public Order getOrderByCode(String code) {
    return repo.getByCode(code);
  }

  public List<Order> findAllOrders() {
    return repo.findAll();
  }

  public boolean deleteOrderById(Long id) {
    repo.deleteById(id);
    return true;
  }

  public boolean deleteOrders(List<Order> orders) {
    for (Order sel : orders) {
      deleteOrderById(sel.getId());
    }
    return true;
  }

  public List<Order> findOrdersByCustomer(Customer customer) {
    return repo.findOrdersByCustomer(customer.getUsername());
  }

  public List<Order> findOrdersByEmployee(Employee employee) {
    return repo.findOrdersByEmployee(employee.getUsername());
  }
  public List<Order> listOrderbyId(Long id){
    return repo.listOrderbyId(id);
  }
}
