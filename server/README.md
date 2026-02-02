# InternshipFinder Server

Backend application built with Spring Boot (Java 17) and Maven.

## Prerequisites

- Java 17 (JDK)
- Maven (or use the Maven wrapper if you add one later)
- PostgreSQL

## Configuration

The server loads configuration from `src/main/resources/application.properties` and expects environment-style properties from a local file.

1. Create an env file next to `server/pom.xml`:

```bash
# from the repo root
copy server\.env.properties.example server\.env.properties
```

2. Edit `server/.env.properties` with your values:

- `SERVER_PORT` (default in example: `8080`)
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRATION_MS`
- SMTP settings (for email/OTP)
- Azure storage settings (optional)

## Run (development)

From the `server/` folder:

```bash
mvn spring-boot:run
```

The server will start on:

- `http://localhost:8080` (if `SERVER_PORT=8080`)

## Run tests

From the `server/` folder:

```bash
mvn test
```

## Build

From the `server/` folder:

```bash
mvn clean package
```

The JAR will be created under `server/target/`.
