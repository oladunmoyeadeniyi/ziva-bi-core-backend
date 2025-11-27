/**
 * ================================================================
 * Ziva BI — Core Backend Entry Point (main.ts)
 * ----------------------------------------------------------------
 * This file bootstraps the NestJS application.
 * It:
 *   - Creates the main AppModule
 *   - Enables CORS (so frontend can call backend)
 *   - Sets a global prefix (/api)
 *   - Listens on PORT from Render (important!)
 * ================================================================
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create the NestJS application instance
  const app = await NestFactory.create(AppModule);

  // Allow requests from any frontend domain during development
  app.enableCors();

  // Every endpoint will start with /api (example: /api/health)
  app.setGlobalPrefix('api');

  // Render assigns a dynamic PORT (example: 10000)
  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`Ziva BI Backend running on port ${port}`);
}

bootstrap();