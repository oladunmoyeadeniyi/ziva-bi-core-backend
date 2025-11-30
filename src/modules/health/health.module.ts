/********************************************************************************************
 * HEALTH MODULE
 *
 * Purpose:
 *  - Provide a simple GET /api/health endpoint
 *  - Allows Render, Docker, Kubernetes, and monitoring agents to confirm the API is alive
 *  - Zero business logic — strictly uptime verification
 ********************************************************************************************/

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}