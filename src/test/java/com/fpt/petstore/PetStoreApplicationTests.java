package com.fpt.petstore;

import com.fpt.petstore.data.FoodData;
import com.fpt.petstore.data.ProductData;
import com.fpt.petstore.entities.Food.FoodType;
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

	@Test
	void liquibaseSeedsCatalog() {
		assertEquals(new FoodData().ALL_FOODS.length, foodRepo.count());
		assertEquals(new ProductData().ALL_PRODUCTS.length, productRepo.count());
		assertFalse(foodRepo.findByType(FoodType.DRY).isEmpty());
		assertFalse(productRepo.findByType(ProductType.DOG).isEmpty());
	}

	@Test
	void demoDataIsLoaded() {
		assertFalse(customerRepo.findAll().isEmpty());
		assertFalse(orderRepo.findOrdersByEmployee("admin").isEmpty());
	}
}
