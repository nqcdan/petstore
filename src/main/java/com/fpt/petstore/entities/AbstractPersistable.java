package com.fpt.petstore.entities;

import java.io.Serializable;
import java.util.Date;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreRemove;
import jakarta.persistence.PreUpdate;

import org.springframework.data.domain.Persistable;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fpt.petstore.util.DateUtil;

import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@MappedSuperclass
@JsonIgnoreProperties(ignoreUnknown = true)
@NoArgsConstructor
@Setter@Getter
public abstract class AbstractPersistable<PK extends Serializable> implements Persistable<PK> {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private PK id;

  @Override
  @JsonIgnore
  public boolean isNew() {
    return null == getId();
  }

  @JsonFormat(pattern = DateUtil.LOCAL_DATETIME_FORMAT)
  protected Date createdTime;

  @JsonFormat(pattern = DateUtil.LOCAL_DATETIME_FORMAT)
  protected Date updatedTime;
  
  @PrePersist
  protected void prePersist() {
      if (this.createdTime == null) createdTime = new Date();
      if (this.updatedTime == null) updatedTime = new Date();
  }

  @PreUpdate
  protected void preUpdate() {
      this.updatedTime = new Date();
  }

  @PreRemove
  protected void preRemove() {
      this.updatedTime = new Date();
  }

}
