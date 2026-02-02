# InternshipFinder Client
 
 Frontend application built with React + Vite.
 
 ## Prerequisites
 
 - Node.js (LTS recommended)
 - npm
 
 ## Install
 
 From the `client/` folder:
 
 ```bash
 npm install
 ```
 
 ## Run (development)
 
 From the `client/` folder:
 
 ```bash
 npm run dev
 ```
 
 Vite will start the dev server and expose it on your network (the project uses `vite --host`).
 
 ## API / Backend connection
 
 The client uses `baseURL: /api` (see `src/services/axios.js`). In development, Vite proxies `/api` to the backend:
 
 - `http://localhost:8080`
 
 (see `vite.config.js`).
 
 ## Build (production)
 
 ```bash
 npm run build
 ```
 
 ## Preview production build
 
 ```bash
 npm run preview
 ```
