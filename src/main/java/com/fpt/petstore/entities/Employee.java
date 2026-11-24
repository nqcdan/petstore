package com.fpt.petstore.entities;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * @author linuss
 */

@Entity
@Table(name = "employee"
//  uniqueConstraints = {
//      @UniqueConstraint(columnNames = {"username", "email"})
//  }
)
@JsonInclude(Include.NON_NULL)
@Setter @Getter
@NoArgsConstructor
public class Employee extends BaseAccount {

  public Employee(String fullName) {
    this.fullName = fullName;
  }
}
