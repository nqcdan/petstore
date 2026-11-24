package com.fpt.petstore.api;

import org.springframework.data.jpa.domain.Specification;

final class Specs {
  private Specs() {}

  /** Case-insensitive "contains" on any of the given attributes; null when q is blank. */
  static <T> Specification<T> containsAny(String q, String... attributes) {
    if (q == null || q.isBlank()) return null;
    String pattern = "%" + q.trim().toLowerCase().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    return (root, query, cb) -> {
      var predicates = new jakarta.persistence.criteria.Predicate[attributes.length];
      for (int i = 0; i < attributes.length; i++) {
        predicates[i] = cb.like(cb.lower(root.get(attributes[i])), pattern, '\\');
      }
      return cb.or(predicates);
    };
  }

  static <T> Specification<T> equalTo(String attribute, Object value) {
    if (value == null) return null;
    return (root, query, cb) -> cb.equal(root.get(attribute), value);
  }
}
