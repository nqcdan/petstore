package com.fpt.petstore;

/** Property prefixes that give a Spring test class its own PostgreSQL schema, so tests never see each other's rows. */
public final class IsolatedDb {

	public static final String URL = "spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/petstore}?currentSchema=";
	public static final String CREATE = "spring.datasource.hikari.connection-init-sql=CREATE SCHEMA IF NOT EXISTS ";

	private IsolatedDb() {
	}
}
