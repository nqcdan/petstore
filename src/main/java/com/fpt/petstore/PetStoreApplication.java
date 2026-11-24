package com.fpt.petstore;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PetStoreApplication extends SpringBootServletInitializer {

  public static void main(String[] args) {
    SpringApplication.run(PetStoreApplication.class, args);
  }
}
