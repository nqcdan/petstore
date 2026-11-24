package com.fpt.petstore.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

/**
 * Stores uploaded images under the upload directory. The client's file name and Content-Type are never trusted:
 * the type comes from the file's magic bytes, the stored name is generated, and the target must stay inside the directory.
 */
@Component
public class ImageStore {

  static final long MAX_BYTES = 2L * 1024 * 1024;

  private final Path root;

  public ImageStore(@Value("${petstore.upload-dir:user-photos}") String uploadDir) {
    this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
  }

  /** Saves the image in a sub directory (for example "catalog") and returns the generated file name. */
  public String store(String subDir, MultipartFile file) {
    if (file == null || file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No image uploaded");
    if (file.getSize() > MAX_BYTES) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image is larger than 2 MB");
    try (InputStream in = file.getInputStream()) {
      byte[] bytes = in.readNBytes((int) MAX_BYTES + 1);
      if (bytes.length > MAX_BYTES) throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "Image is larger than 2 MB");
      String extension = extensionOf(bytes);
      if (extension == null) throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only PNG, JPEG or WebP images are accepted");
      Path dir = root.resolve(subDir).normalize();
      String name = UUID.randomUUID() + "." + extension;
      Path target = dir.resolve(name).normalize();
      if (!target.startsWith(root)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid upload location");
      Files.createDirectories(dir);
      Files.copy(new java.io.ByteArrayInputStream(bytes), target, StandardCopyOption.REPLACE_EXISTING);
      return name;
    } catch (IOException e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store the image", e);
    }
  }

  static String extensionOf(byte[] b) {
    if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return "png";
    if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return "jpg";
    if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') return "webp";
    return null;
  }
}
