package com.fpt.petstore.api;

import com.fpt.petstore.api.CatalogService.Kind;
import com.fpt.petstore.api.Dto.CatalogItem;
import com.fpt.petstore.api.Dto.PageDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Public catalog, no authentication. */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Catalog")
public class CatalogController {

  private final CatalogService catalog;

  public CatalogController(CatalogService catalog) {
    this.catalog = catalog;
  }

  @GetMapping("/products")
  @Operation(summary = "List products (type: CLOTHES, CAT or DOG)")
  public PageDto<CatalogItem> products(@RequestParam(required = false) String q, @RequestParam(required = false) String type,
                                       @PageableDefault(size = 20, sort = "id") Pageable pageable) {
    return catalog.list(Kind.PRODUCT, q, type, pageable);
  }

  @GetMapping("/products/{id}")
  public CatalogItem product(@PathVariable Long id) {
    return catalog.get(Kind.PRODUCT, id);
  }

  @GetMapping("/foods")
  @Operation(summary = "List foods (type: DRY, SNACK, MILK or WET)")
  public PageDto<CatalogItem> foods(@RequestParam(required = false) String q, @RequestParam(required = false) String type,
                                    @PageableDefault(size = 20, sort = "id") Pageable pageable) {
    return catalog.list(Kind.FOOD, q, type, pageable);
  }

  @GetMapping("/foods/{id}")
  public CatalogItem food(@PathVariable Long id) {
    return catalog.get(Kind.FOOD, id);
  }
}
