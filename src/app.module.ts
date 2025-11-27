/**
 * ================================================================
 * Ziva BI — AppModule (root NestJS module)
 * ----------------------------------------------------------------
 * This module wires up:
 *   - Controllers
 *   - Services
 *   - Future modules (Vendor, AP, AR, HR, Tax, etc.)
 * ================================================================
 */

import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}