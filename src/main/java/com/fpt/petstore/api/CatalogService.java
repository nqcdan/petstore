package com.fpt.petstore.api;

import com.fpt.petstore.api.Dto.CatalogItem;
import com.fpt.petstore.api.Dto.CatalogItemRequest;
import com.fpt.petstore.api.Dto.PageDto;
import com.fpt.petstore.entities.BaseProduct;
import com.fpt.petstore.entities.Food;
import com.fpt.petstore.entities.Food.FoodType;
import com.fpt.petstore.entities.Product;
import com.fpt.petstore.entities.Product.ProductType;
import com.fpt.petstore.repository.FoodRepository;
import com.fpt.petstore.repository.ProductsRepository;
import com.fpt.petstore.services.FileUploadUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/** Products and foods share one shape (BaseProduct), so one service handles both. */
@Service
@Transactional
public class CatalogService {

  public enum Kind { PRODUCT, FOOD }

  private static final Map<String, String> IMAGE_TYPES = Map.of("image/png", "png", "image/jpeg", "jpg", "image/webp", "webp");

  private final ProductsRepository products;
  private final FoodRepository foods;

  private final String uploadDir;

  public CatalogService(ProductsRepository products, FoodRepository foods, @Value("${petstore.upload-dir:user-photos}") String uploadDir) {
    this.products = products;
    this.foods = foods;
    this.uploadDir = uploadDir;
  }

  @Transactional(readOnly = true)
  public PageDto<CatalogItem> list(Kind kind, String q, String type, Pageable pageable) {
    Specification<BaseProduct> spec = Specification.where(Specs.<BaseProduct>containsAny(q, "name", "sortName"))
      .and(Specs.equalTo("type", parseType(kind, type)));
    Page<BaseProduct> page = specs(kind).findAll(spec, pageable);
    return new PageDto<>(page.map(this::toItem).getContent(), page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
  }

  @Transactional(readOnly = true)
  public CatalogItem get(Kind kind, Long id) {
    return toItem(find(kind, id));
  }

  public CatalogItem create(Kind kind, CatalogItemRequest request) {
    BaseProduct entity = kind == Kind.PRODUCT ? new Product() : new Food();
    apply(kind, entity, request);
    JpaRepository<BaseProduct, Long> repo = repo(kind);
    repo.save(entity);
    if (entity.getSortName() == null || entity.getSortName().isBlank()) {
      entity.setSortName(slug(entity.getName()) + "-" + entity.getId());
    }
    return toItem(repo.save(entity));
  }

  public CatalogItem update(Kind kind, Long id, CatalogItemRequest request) {
    BaseProduct entity = find(kind, id);
    apply(kind, entity, request);
    return toItem(repo(kind).save(entity));
  }

  public void delete(Kind kind, Long id) {
    repo(kind).delete(find(kind, id));
  }

  public CatalogItem uploadImage(Kind kind, Long id, MultipartFile file) {
    String extension = IMAGE_TYPES.get(file.getContentType());
    if (extension == null) {
      throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only PNG, JPEG or WebP images are accepted");
    }
    BaseProduct entity = find(kind, id);
    String name = UUID.randomUUID() + "." + extension;
    try {
      FileUploadUtil.saveFile(uploadDir + "/catalog", name, file);
    } catch (IOException e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store the image", e);
    }
    entity.setPic("catalog/" + name);
    return toItem(repo(kind).save(entity));
  }

  private void apply(Kind kind, BaseProduct entity, CatalogItemRequest request) {
    entity.setName(request.name().trim());
    entity.setPrice(request.price());
    entity.setDescription(request.description());
    if (request.sortName() != null && !request.sortName().isBlank()) entity.setSortName(request.sortName().trim());
    Enum<?> type = parseType(kind, request.type());
    if (entity instanceof Product p) p.setType((ProductType) type);
    else ((Food) entity).setType((FoodType) type);
  }

  private Enum<?> parseType(Kind kind, String type) {
    if (type == null || type.isBlank()) return null;
    try {
      String value = type.trim().toUpperCase(Locale.ROOT);
      return kind == Kind.PRODUCT ? ProductType.valueOf(value) : FoodType.valueOf(value);
    } catch (IllegalArgumentException e) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown type: " + type);
    }
  }

  private BaseProduct find(Kind kind, Long id) {
    return repo(kind).findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, kind + " " + id + " not found"));
  }

  @SuppressWarnings("unchecked")
  private JpaRepository<BaseProduct, Long> repo(Kind kind) {
    return (JpaRepository<BaseProduct, Long>) (kind == Kind.PRODUCT ? products : foods);
  }

  @SuppressWarnings("unchecked")
  private JpaSpecificationExecutor<BaseProduct> specs(Kind kind) {
    return (JpaSpecificationExecutor<BaseProduct>) (kind == Kind.PRODUCT ? products : foods);
  }

  private CatalogItem toItem(BaseProduct e) {
    Enum<?> type = e instanceof Product p ? p.getType() : ((Food) e).getType();
    String pic = e.getPic();
    String imageUrl = pic == null ? null : pic.contains("/") ? "/user-photos/" + pic : "/img/product/" + pic;
    return new CatalogItem(e.getId(), e.getName(), e.getSortName(), e.getPrice(), imageUrl, e.getDescription(), type == null ? null : type.name());
  }

  private static String slug(String name) {
    String ascii = Normalizer.normalize(name, Normalizer.Form.NFD).replaceAll("\\p{M}", "").replace('đ', 'd').replace('Đ', 'D');
    return ascii.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
  }
}
