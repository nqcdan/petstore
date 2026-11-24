package com.fpt.petstore.entities;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.fpt.petstore.util.DateUtil;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.Date;

@Entity
@Table(name = "customer")
@JsonInclude(Include.NON_NULL)
@Setter @Getter @NoArgsConstructor
public class Customer extends BaseAccount {

  private String token;
  @JsonFormat(pattern = DateUtil.COMPACT_DATE_FORMAT)
  private Date createdTimeToken;

  public Customer(String fullName) {
    this.fullName = fullName;
  }
}
