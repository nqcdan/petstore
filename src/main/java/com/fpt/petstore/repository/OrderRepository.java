package com.fpt.petstore.repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fpt.petstore.entities.Order;

/**
 * @author linuss
 */

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>, JpaSpecificationExecutor<Order>{
  
  @Query(
      "SELECT o FROM Order o WHERE o.code = :code")
  public Order getByCode(@Param("code") String code);
  
  @Query("SELECT o FROM Order o WHERE o.customer.username = :username")
  public List<Order> findOrdersByCustomer(@Param("username") String username);
  
  @Query("SELECT o FROM Order o WHERE o.employee.username = :username")
  public List<Order> findOrdersByEmployee(@Param("username") String username);

  @Query(value = "select * from Orders where customerId= ?1",nativeQuery = true)
  public List<Order> listOrderbyId(Long id);

  Page<Order> findByOwnerSub(String ownerSub, Pageable pageable);

  Optional<Order> findByCodeAndOwnerSub(String code, String ownerSub);

  @Modifying
  @Query("UPDATE Order o SET o.customer = null WHERE o.customer.id = :id")
  void detachCustomer(@Param("id") Long id);

  @Modifying
  @Query("UPDATE Order o SET o.employee = null WHERE o.employee.id = :id")
  void detachEmployee(@Param("id") Long id);

  @Query("SELECT CAST(o.transactionDate AS LocalDate), COUNT(o), SUM(o.total) FROM Order o "
    + "WHERE o.state = :state AND o.transactionDate >= :from GROUP BY CAST(o.transactionDate AS LocalDate)")
  List<Object[]> dailyRevenue(@Param("state") Order.State state, @Param("from") Date from);

  @Query("SELECT o.state, COUNT(o) FROM Order o GROUP BY o.state")
  List<Object[]> countByState();

  @Query("SELECT i.name, SUM(i.quantity), SUM(i.total) FROM Order o JOIN o.orderItems i "
    + "WHERE o.state = :state GROUP BY i.name ORDER BY SUM(i.total) DESC")
  List<Object[]> topItems(@Param("state") Order.State state, Pageable pageable);
}
