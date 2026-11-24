package com.fpt.petstore.controller;

import com.fpt.petstore.IsolatedDb;
import com.fpt.petstore.entities.Customer;
import com.fpt.petstore.repository.CustomerRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.flash;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Regression: the legacy avatar upload used the client file name, so "../../app.war" could overwrite any writable file. */
@SpringBootTest(properties = { "petstore.upload-dir=target/test-avatars/uploads", IsolatedDb.URL + "avatar_tests", IsolatedDb.CREATE + "avatar_tests" })
@AutoConfigureMockMvc
class AvatarUploadTests {

	static final byte[] PNG = { (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0 };

	@Autowired
	MockMvc mvc;
	@Autowired
	CustomerRepository customers;

	@Test
	void traversalFileNameStaysInsideTheUploadDirectory() throws Exception {
		Customer customer = customers.findAll().get(0);
		Path sentinel = Paths.get("target/test-avatars/app.war").toAbsolutePath();
		Files.createDirectories(sentinel.getParent());
		Files.writeString(sentinel, "original");

		mvc.perform(multipart("/updateInfor").file(new MockMultipartFile("avatarUrl", "../../app.war", "image/png", PNG))
				.param("fullName", "Name").param("phoneNumber", "1").param("address", "a").param("birthday", "2000-01-01")
				.header("Referer", "/information").sessionAttr("customer", customer))
			.andExpect(status().is3xxRedirection()).andExpect(flash().attribute("themeNotification", "success"));

		assertEquals("original", Files.readString(sentinel));
		String stored = customers.findById(customer.getId()).orElseThrow().getAvatarUrl();
		assertTrue(stored.matches("[0-9a-f-]{36}\\.png"), stored);
		assertTrue(Files.exists(Paths.get("target/test-avatars/uploads/avatars", String.valueOf(customer.getId()), stored)));
	}

	@Test
	void nonImageIsRejectedAndNothingIsWritten() throws Exception {
		Customer customer = customers.findAll().get(1);
		String before = customers.findById(customer.getId()).orElseThrow().getAvatarUrl();

		mvc.perform(multipart("/updateInfor").file(new MockMultipartFile("avatarUrl", "x.png", "image/png", "not an image".getBytes()))
				.param("fullName", "Name").param("birthday", "2000-01-01").header("Referer", "/information").sessionAttr("customer", customer))
			.andExpect(status().is3xxRedirection()).andExpect(flash().attribute("themeNotification", "error"));

		assertEquals(before, customers.findById(customer.getId()).orElseThrow().getAvatarUrl());
		Path dir = Paths.get("target/test-avatars/uploads/avatars", String.valueOf(customer.getId()));
		if (Files.exists(dir)) try (Stream<Path> files = Files.list(dir)) { assertFalse(files.findAny().isPresent()); }
	}
}
