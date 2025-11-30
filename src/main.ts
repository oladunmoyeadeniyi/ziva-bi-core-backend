/***********************************************************************
 * ZIVA BI — BACKEND ENTRYPOINT (main.ts)
 *
 * This is the first file executed when the backend starts.
 *
 * Responsibilities:
 *  - Bootstrap NestJS
 *  - Global API prefix (/api)
 *  - Enable CORS (frontend → backend communication)
 *  - Register global validation rules
 *  - Apply security middlewares (Helmet)
 *  - Multi-tenant domain resolver
 *  - Run server on PORT from environment (Render uses this)
 ***********************************************************************/

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

/**
 * Optional middleware:
 * Extracts tenant code from:
 *   - subdomain   → e.g., tenant1.zivabi.com
 *   - header      → x-tenant-id
 *   - query param → ?tenant=abc
 *
 * Saves the detected value into request["tenant"].
 */
function tenantResolverMiddleware(req, res, next) {
  const host = req.headers.host || '';
  let tenant = null;

  // 1. header
  if (req.headers['x-tenant-id']) {
    tenant = req.headers['x-tenant-id'];
  }

  // 2. query parameter
  if (!tenant && req.query.tenant) {
    tenant = req.query.tenant;
  }

  // 3. subdomain (future use)
  if (!tenant && host.includes('.')) {
    const [sub] = host.split('.');
    if (sub && sub !== 'www') tenant = sub;
  }

  // fallback — super admin scope
  req.tenant = tenant || process.env.DEFAULT_TENANT_CODE || 'core';

  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  /***********************************************************
   * SECURITY MIDDLEWARES
   ***********************************************************/
  app.use(helmet()); // protect against common attacks
  app.enableCors({
    origin: ['https://ziva-bi-frontend.onrender.com', '*'], // allow frontend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  /***********************************************************
   * GLOBAL VALIDATION PIPE
   ***********************************************************/
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown fields
      forbidNonWhitelisted: false, // do not throw errors for extra fields
      transform: true,
    }),
  );

  /***********************************************************
   * MULTI-TENANT MIDDLEWARE
   ***********************************************************/
  app.use(tenantResolverMiddleware);

  /***********************************************************
    GLOBAL PREFIX
    All API endpoints become:
    https://domain/api/...
  ***********************************************************/
  const globalPrefix = process.env.GLOBAL_PREFIX || '/api';
  app.setGlobalPrefix(globalPrefix);

  /***********************************************************
   * START SERVER
   * Render requires binding to process.env.PORT
   ***********************************************************/
  const port = process.env.PORT || 10000;
  await app.listen(port);

  console.log(`Ziva BI Backend running on port ${port}`);
}

bootstrap();