package com.fpt.petstore.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "petstore.upload-dir=target/test-uploads")
@AutoConfigureMockMvc
class ApiTests {

	@Autowired
	MockMvc mvc;
	@Autowired
	ObjectMapper json;

	static RequestPostProcessor admin() {
		return SecurityMockMvcRequestPostProcessors.jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
	}

	static RequestPostProcessor customer(String username) {
		return SecurityMockMvcRequestPostProcessors.jwt()
			.jwt(j -> j.claim("preferred_username", username).claim("name", "Test " + username).claim("email", username + "@example.com"))
			.authorities(new SimpleGrantedAuthority("ROLE_CUSTOMER"));
	}

	JsonNode body(org.springframework.test.web.servlet.ResultActions result) throws Exception {
		return json.readTree(result.andReturn().getResponse().getContentAsString());
	}

	@Test
	void catalogIsPublic() throws Exception {
		JsonNode page = body(mvc.perform(get("/api/v1/products?size=5")).andExpect(status().isOk()));
		assertEquals(5, page.get("items").size());
		assertTrue(page.get("totalItems").asInt() > 5);
		mvc.perform(get("/api/v1/foods?type=dry&q=pate")).andExpect(status().isOk());
		mvc.perform(get("/api/v1/foods?type=nope")).andExpect(status().isBadRequest());
		mvc.perform(get("/api/v1/products/999999")).andExpect(status().isNotFound());
	}

	@Test
	void ordersNeedAToken() throws Exception {
		mvc.perform(get("/api/v1/orders")).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/v1/admin/stats")).andExpect(status().isUnauthorized());
	}

	@Test
	void customerCannotReachAdminApi() throws Exception {
		mvc.perform(get("/api/v1/admin/stats").with(customer("bob"))).andExpect(status().isForbidden());
		mvc.perform(get("/api/v1/admin/products").with(customer("bob"))).andExpect(status().isForbidden());
		mvc.perform(delete("/api/v1/admin/customers/1").with(customer("bob"))).andExpect(status().isForbidden());
	}

	@Test
	void customerPlacesAndReadsOwnOrder() throws Exception {
		JsonNode food = body(mvc.perform(get("/api/v1/foods?size=1")).andExpect(status().isOk())).get("items").get(0);
		String cart = "{\"items\":[{\"type\":\"FOOD\",\"id\":" + food.get("id") + ",\"quantity\":2},{\"type\":\"FOOD\",\"id\":" + food.get("id")
			+ ",\"quantity\":1}],\"paymentMethod\":\"ATM\",\"note\":\"leave at door\"}";
		int expected = food.get("price").asInt() * 3;

		JsonNode quote = body(mvc.perform(post("/api/v1/cart/quote").with(customer("alice")).contentType(MediaType.APPLICATION_JSON).content(cart))
			.andExpect(status().isOk()));
		assertEquals(expected, quote.get("total").asInt());
		assertEquals(1, quote.get("items").size());

		JsonNode order = body(mvc.perform(post("/api/v1/orders").with(customer("alice")).contentType(MediaType.APPLICATION_JSON).content(cart))
			.andExpect(status().isCreated()));
		assertEquals("DUE", order.get("state").asText());
		assertEquals("ATM", order.get("paymentMethod").asText());
		assertEquals(expected, order.get("total").asInt());

		mvc.perform(get("/api/v1/orders").with(customer("alice"))).andExpect(status().isOk()).andExpect(jsonPath("$.totalItems").value(1));
		mvc.perform(get("/api/v1/orders/" + order.get("code").asText()).with(customer("alice"))).andExpect(status().isOk());
		mvc.perform(get("/api/v1/orders/" + order.get("code").asText()).with(customer("mallory"))).andExpect(status().isNotFound());

		mvc.perform(post("/api/v1/orders").with(customer("alice")).contentType(MediaType.APPLICATION_JSON).content("{\"items\":[]}"))
			.andExpect(status().isBadRequest());

		JsonNode paid = body(mvc.perform(patch("/api/v1/admin/orders/" + order.get("id") + "/state").with(admin())
			.contentType(MediaType.APPLICATION_JSON).content("{\"state\":\"PAID\"}")).andExpect(status().isOk()));
		assertEquals("PAID", paid.get("state").asText());
		mvc.perform(get("/api/v1/admin/orders?state=PAID&q=alice").with(admin())).andExpect(status().isOk())
			.andExpect(jsonPath("$.items[0].code").value(order.get("code").asText()));
	}

	@Test
	void adminManagesProductsWithImage() throws Exception {
		String request = "{\"name\":\"Test collar\",\"price\":12000,\"description\":\"d\",\"type\":\"dog\"}";
		JsonNode created = body(mvc.perform(post("/api/v1/admin/products").with(admin()).contentType(MediaType.APPLICATION_JSON).content(request))
			.andExpect(status().isCreated()));
		long id = created.get("id").asLong();
		assertEquals("DOG", created.get("type").asText());
		assertTrue(created.get("sortName").asText().startsWith("test-collar-"));

		mvc.perform(put("/api/v1/admin/products/" + id).with(admin()).contentType(MediaType.APPLICATION_JSON)
			.content(request.replace("12000", "15000"))).andExpect(status().isOk()).andExpect(jsonPath("$.price").value(15000));
		mvc.perform(post("/api/v1/admin/products").with(admin()).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"\",\"price\":-1}"))
			.andExpect(status().isBadRequest());

		MockMultipartFile image = new MockMultipartFile("file", "../../a.png", "image/png", new byte[] { (byte) 0x89, 'P', 'N', 'G', 13, 10, 26, 10, 0 });
		mvc.perform(multipart("/api/v1/admin/products/" + id + "/image").file(image).with(admin())).andExpect(status().isOk())
			.andExpect(jsonPath("$.imageUrl").value(org.hamcrest.Matchers.startsWith("/api/v1/photos/catalog/")));
		String url = json.readTree(mvc.perform(get("/api/v1/admin/products/" + id).with(admin())).andReturn().getResponse().getContentAsString())
			.get("imageUrl").asText();
		mvc.perform(get(url)).andExpect(status().isOk());
		MockMultipartFile text = new MockMultipartFile("file", "a.txt", "text/plain", new byte[] { 1 });
		mvc.perform(multipart("/api/v1/admin/products/" + id + "/image").file(text).with(admin())).andExpect(status().isUnsupportedMediaType());
		MockMultipartFile spoofed = new MockMultipartFile("file", "a.png", "image/png", "<html>".getBytes());
		mvc.perform(multipart("/api/v1/admin/products/" + id + "/image").file(spoofed).with(admin())).andExpect(status().isUnsupportedMediaType());

		mvc.perform(delete("/api/v1/admin/products/" + id).with(admin())).andExpect(status().isNoContent());
		mvc.perform(get("/api/v1/products/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void adminManagesAccounts() throws Exception {
		String request = "{\"username\":\"new.user\",\"fullName\":\"New User\",\"email\":\"new@example.com\",\"gender\":\"Female\"}";
		JsonNode created = body(mvc.perform(post("/api/v1/admin/customers").with(admin()).contentType(MediaType.APPLICATION_JSON).content(request))
			.andExpect(status().isCreated()));
		mvc.perform(post("/api/v1/admin/customers").with(admin()).contentType(MediaType.APPLICATION_JSON).content(request))
			.andExpect(status().isConflict());
		mvc.perform(get("/api/v1/admin/customers?q=NEW.USER").with(admin())).andExpect(jsonPath("$.totalItems").value(1));
		mvc.perform(delete("/api/v1/admin/customers/" + created.get("id")).with(admin())).andExpect(status().isNoContent());
		mvc.perform(get("/api/v1/admin/employees").with(admin())).andExpect(status().isOk());
	}

	@Test
	void paymentMethodDefaultsToCod() throws Exception {
		JsonNode order = body(mvc.perform(post("/api/v1/orders").with(customer("carol")).contentType(MediaType.APPLICATION_JSON)
			.content("{\"items\":[{\"type\":\"PRODUCT\",\"id\":1,\"quantity\":1}]}")).andExpect(status().isCreated()));
		assertEquals("COD", order.get("paymentMethod").asText());
		mvc.perform(post("/api/v1/orders").with(customer("carol")).contentType(MediaType.APPLICATION_JSON)
			.content("{\"items\":[{\"type\":\"PRODUCT\",\"id\":1,\"quantity\":1}],\"paymentMethod\":\"BITCOIN\"}")).andExpect(status().isBadRequest());
	}

	@Test
	void contactFormIsPublicAndValidated() throws Exception {
		mvc.perform(post("/api/v1/contact").contentType(MediaType.APPLICATION_JSON)
			.content("{\"name\":\"Ann\",\"email\":\"ann@example.com\",\"message\":\"Hello shop\"}")).andExpect(status().isNoContent());
		mvc.perform(post("/api/v1/contact").contentType(MediaType.APPLICATION_JSON)
			.content("{\"name\":\"Ann\",\"email\":\"not-an-email\",\"message\":\"\"}")).andExpect(status().isBadRequest());
	}

	@Test
	void adminStats() throws Exception {
		JsonNode stats = body(mvc.perform(get("/api/v1/admin/stats").with(admin())).andExpect(status().isOk()));
		assertEquals(30, stats.get("revenueByDay").size());
		assertTrue(stats.get("totalCustomers").asLong() > 0);
		assertTrue(stats.get("ordersByState").size() > 0);
	}

	@Test
	void openApiDocumentsOnlyTheRestApi() throws Exception {
		String doc = mvc.perform(get("/v3/api-docs")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		assertTrue(doc.contains("/api/v1/admin/stats"));
		assertTrue(doc.contains("/api/v1/admin/products/{id}/image"));
		assertTrue(!doc.contains("trang-chu"));
	}

	@Test
	void keycloakRolesBecomeAuthorities() {
		Jwt token = Jwt.withTokenValue("t").header("alg", "none").subject("s").issuedAt(Instant.now()).expiresAt(Instant.now().plusSeconds(60))
			.claim("realm_access", Map.of("roles", List.of("customer", "offline_access")))
			.claim("resource_access", Map.of("petstore-api", Map.of("roles", List.of("admin")), "other", Map.of("roles", List.of("root"))))
			.build();
		Set<String> roles = ApiSecurityConfig.authorities(token, "petstore-api").stream().map(a -> a.getAuthority()).collect(Collectors.toSet());
		assertEquals(Set.of("ROLE_CUSTOMER", "ROLE_OFFLINE_ACCESS", "ROLE_ADMIN"), roles);
	}
}
