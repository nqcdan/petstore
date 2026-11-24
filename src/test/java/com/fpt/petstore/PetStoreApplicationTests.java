package com.fpt.petstore;

import com.fpt.petstore.api.OrderApiService;
import com.fpt.petstore.data.FoodData;
import com.fpt.petstore.data.ProductData;
import com.fpt.petstore.entities.Food.FoodType;
import com.fpt.petstore.entities.Order;
import com.fpt.petstore.entities.Product.ProductType;
import com.fpt.petstore.repository.CustomerRepository;
import com.fpt.petstore.repository.FoodRepository;
import com.fpt.petstore.repository.OrderRepository;
import com.fpt.petstore.repository.ProductsRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class PetStoreApplicationTests {

	@Autowired
	FoodRepository foodRepo;
	@Autowired
	ProductsRepository productRepo;
	@Autowired
	CustomerRepository customerRepo;
	@Autowired
	OrderRepository orderRepo;
	@Autowired
	OrderApiService orderApi;

	@Test
	void liquibaseSeedsCatalog() {
		assertEquals(new FoodData().ALL_FOODS.length, foodRepo.count());
		assertEquals(new ProductData().ALL_PRODUCTS.length, productRepo.count());
		assertFalse(foodRepo.findByType(FoodType.DRY).isEmpty());
		assertFalse(productRepo.findByType(ProductType.DOG).isEmpty());
	}

	@Test
	void demoOrdersAreRecentAndHaveStates() {
		var all = orderRepo.findAll();
		assertTrue(all.stream().noneMatch(o -> o.getState() == null));
		assertTrue(all.stream().noneMatch(o -> o.getTransactionDate().before(java.sql.Timestamp.valueOf(java.time.LocalDateTime.now().minusDays(31)))));
		var states = all.stream().map(o -> o.getState()).collect(java.util.stream.Collectors.toSet());
		assertEquals(java.util.Set.of(Order.State.PAID, Order.State.DUE, Order.State.CANCEL), states);
		var stats = orderApi.stats();
		assertTrue(stats.revenueByDay().stream().filter(d -> d.revenue() > 0).count() >= 15);
		assertFalse(stats.topProducts().isEmpty());
	}

	@Test
	void demoDataIsLoaded() {
		assertFalse(customerRepo.findAll().isEmpty());
		assertFalse(orderRepo.findOrdersByEmployee("admin").isEmpty());
	}
}
