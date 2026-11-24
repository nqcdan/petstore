package com.fpt.petstore.api;

import com.fpt.petstore.api.Dto.ContactRequest;
import com.fpt.petstore.entities.Contact;
import com.fpt.petstore.repository.ContactRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Date;

/** Saves contact-form messages and mails them to the store when SMTP is configured; a mail failure never fails the request. */
@Service
public class ContactService {

  private static final Logger log = LoggerFactory.getLogger(ContactService.class);

  private final ContactRepository contacts;
  private final ObjectProvider<JavaMailSender> mailSender;
  private final String recipient;

  public ContactService(ContactRepository contacts, ObjectProvider<JavaMailSender> mailSender,
                        @Value("${petstore.contact.notify-to:${spring.mail.username:}}") String recipient) {
    this.contacts = contacts;
    this.mailSender = mailSender;
    this.recipient = recipient;
  }

  public void receive(ContactRequest request) {
    contacts.save(new Contact(request.name().trim(), request.email().trim(), request.message().trim(), new Date()));
    JavaMailSender sender = mailSender.getIfAvailable();
    if (sender == null || recipient == null || recipient.isBlank()) return;
    try {
      SimpleMailMessage mail = new SimpleMailMessage();
      mail.setTo(recipient);
      mail.setReplyTo(request.email().trim());
      mail.setSubject("PetStore contact from " + request.name().trim());
      mail.setText(request.message().trim());
      sender.send(mail);
    } catch (Exception e) {
      log.warn("Contact mail not sent: {}", e.getMessage());
    }
  }
}
