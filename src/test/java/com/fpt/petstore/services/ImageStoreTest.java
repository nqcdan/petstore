package com.fpt.petstore.services;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ImageStoreTest {

	static final byte[] PNG = { (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0 };

	@TempDir
	Path tmp;

	ImageStore store() {
		return new ImageStore(tmp.resolve("uploads").toString());
	}

	@Test
	void clientFileNameIsIgnoredAndTraversalCannotEscape() throws Exception {
		Files.createDirectories(tmp.resolve("uploads"));
		Path victim = tmp.resolve("app.war");
		Files.writeString(victim, "original");

		String name = store().store("avatars/7", new MockMultipartFile("avatarUrl", "../../../app.war", "application/java-archive", PNG));

		assertTrue(name.matches("[0-9a-f-]{36}\\.png"), name);
		assertEquals("original", Files.readString(victim));
		assertTrue(Files.exists(tmp.resolve("uploads/avatars/7").resolve(name)));
		try (Stream<Path> all = Files.walk(tmp)) {
			assertEquals(0, all.filter(p -> p.getFileName().toString().contains("..")).count());
		}
	}

	@Test
	void subDirectoryCannotEscapeTheUploadRoot() {
		ResponseStatusException e = assertThrows(ResponseStatusException.class,
			() -> store().store("../outside", new MockMultipartFile("f", "a.png", "image/png", PNG)));
		assertEquals(400, e.getStatusCode().value());
		assertFalse(Files.exists(tmp.resolve("outside")));
	}

	@Test
	void typeComesFromContentNotFromClaims() {
		byte[] html = "<script>alert(1)</script>".getBytes();
		ResponseStatusException e = assertThrows(ResponseStatusException.class,
			() -> store().store("catalog", new MockMultipartFile("f", "evil.png", "image/png", html)));
		assertEquals(415, e.getStatusCode().value());
	}

	@Test
	void acceptsJpegAndWebpAndRejectsEmptyAndOversized() {
		ImageStore store = store();
		assertTrue(store.store("catalog", new MockMultipartFile("f", "x", "text/plain", new byte[] { (byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 1 })).endsWith(".jpg"));
		byte[] webp = "RIFF\0\0\0\0WEBPVP8 ".getBytes();
		assertTrue(store.store("catalog", new MockMultipartFile("f", "x", "x/y", webp)).endsWith(".webp"));
		assertEquals(400, assertThrows(ResponseStatusException.class, () -> store.store("catalog", new MockMultipartFile("f", new byte[0]))).getStatusCode().value());
		byte[] big = new byte[(int) ImageStore.MAX_BYTES + 1];
		System.arraycopy(PNG, 0, big, 0, PNG.length);
		assertEquals(413, assertThrows(ResponseStatusException.class, () -> store.store("catalog", new MockMultipartFile("f", "b.png", "image/png", big))).getStatusCode().value());
	}
}
