# Ziva BI — Backend (Core)

This repo contains the Ziva BI backend core (NestJS + TypeORM + PostgreSQL).
It is split into chunks for safe delivery and easy deployment.

## CHUNK 0 — Bootstrap
This chunk contains minimal files to initialize the repo and deploy to Render.

## How to proceed
1. Create a new GitHub repository named `ziva-bi-core-backend`.
2. Commit CHUNK 0 files and push to `main`.
3. Connect repo to Render and create a Web Service for the backend.
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Environment variables must include DATABASE_URL and NODE_ENV
4. I'll provide CHUNK 1 (app skeleton) immediately after you push.

## Contacts
If you get stuck at any step paste the Render build logs here and I'll debug.
