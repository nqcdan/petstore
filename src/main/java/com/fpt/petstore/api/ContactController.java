package com.fpt.petstore.api;

import com.fpt.petstore.api.Dto.ContactRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Catalog")
public class ContactController {

  private final ContactService contact;

  public ContactController(ContactService contact) {
    this.contact = contact;
  }

  @PostMapping("/contact")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  @Operation(summary = "Contact form, public. Stored always, mailed to the store when SMTP is configured")
  public void send(@Valid @RequestBody ContactRequest request) {
    contact.receive(request);
  }
}
