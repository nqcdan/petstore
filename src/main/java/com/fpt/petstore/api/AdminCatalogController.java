package com.fpt.petstore.api;

import com.fpt.petstore.api.CatalogService.Kind;
import com.fpt.petstore.api.Dto.CatalogItem;
import com.fpt.petstore.api.Dto.CatalogItemRequest;
import com.fpt.petstore.api.Dto.PageDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/** Admin CRUD for products and foods, including image upload. */
@RestController
@RequestMapping("/api/v1/admin")
@Tag(name = "Admin catalog")
@SecurityRequirement(name = "keycloak")
public class AdminCatalogController {

  private final CatalogService catalog;

  public AdminCatalogController(CatalogService catalog) {
    this.catalog = catalog;
  }

  @GetMapping("/products")
  public PageDto<CatalogItem> products(@RequestParam(required = false) String q, @RequestParam(required = false) String type,
                                       @PageableDefault(size = 20, sort = "id") Pageable pageable) {
    return catalog.list(Kind.PRODUCT, q, type, pageable);
  }

  @GetMapping("/products/{id}")
  public CatalogItem product(@PathVariable Long id) {
    return catalog.get(Kind.PRODUCT, id);
  }

  @PostMapping("/products")
  @ResponseStatus(HttpStatus.CREATED)
  public CatalogItem createProduct(@Valid @RequestBody CatalogItemRequest request) {
    return catalog.create(Kind.PRODUCT, request);
  }

  @PutMapping("/products/{id}")
  public CatalogItem updateProduct(@PathVariable Long id, @Valid @RequestBody CatalogItemRequest request) {
    return catalog.update(Kind.PRODUCT, id, request);
  }

  @DeleteMapping("/products/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteProduct(@PathVariable Long id) {
    catalog.delete(Kind.PRODUCT, id);
  }

  @PostMapping(value = "/products/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Upload a product image (PNG, JPEG or WebP, up to 5 MB) as multipart field `file`")
  public CatalogItem productImage(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
    return catalog.uploadImage(Kind.PRODUCT, id, file);
  }

  @GetMapping("/foods")
  public PageDto<CatalogItem> foods(@RequestParam(required = false) String q, @RequestParam(required = false) String type,
                                    @PageableDefault(size = 20, sort = "id") Pageable pageable) {
    return catalog.list(Kind.FOOD, q, type, pageable);
  }

  @GetMapping("/foods/{id}")
  public CatalogItem food(@PathVariable Long id) {
    return catalog.get(Kind.FOOD, id);
  }

  @PostMapping("/foods")
  @ResponseStatus(HttpStatus.CREATED)
  public CatalogItem createFood(@Valid @RequestBody CatalogItemRequest request) {
    return catalog.create(Kind.FOOD, request);
  }

  @PutMapping("/foods/{id}")
  public CatalogItem updateFood(@PathVariable Long id, @Valid @RequestBody CatalogItemRequest request) {
    return catalog.update(Kind.FOOD, id, request);
  }

  @DeleteMapping("/foods/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteFood(@PathVariable Long id) {
    catalog.delete(Kind.FOOD, id);
  }

  @PostMapping(value = "/foods/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Upload a food image (PNG, JPEG or WebP, up to 5 MB) as multipart field `file`")
  public CatalogItem foodImage(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
    return catalog.uploadImage(Kind.FOOD, id, file);
  }
}
