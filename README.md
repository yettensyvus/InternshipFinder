# InternshipFinder (Full Stack)

This repository contains a full-stack Internship & Job Portal:

- `server/`: Spring Boot (Java 17) backend
- `client/`: React + Vite frontend

## Quick start (run the whole app)

### 1) Start the backend

1. Configure the server env file:

```bash
copy server\.env.properties.example server\.env.properties
```

2. Update `server/.env.properties` with your database/SMTP/JWT values.

3. Start the server:

```bash
# from the server/ folder
mvn spring-boot:run
```

Backend default URL:

- `http://localhost:8080`

### 2) Start the frontend

In a second terminal:

```bash
# from the client/ folder
npm install
npm run dev
```

Frontend will run on the URL shown by Vite (usually `http://localhost:5173`).

### 3) How client talks to server

The client sends API requests to `/api` (see `client/src/services/axios.js`).

During development, Vite proxies:

- `/api` -> `http://localhost:8080`

(see `client/vite.config.js`).

## Project documentation

- Client setup: `client/README.md`
- Server setup: `server/README.md`
