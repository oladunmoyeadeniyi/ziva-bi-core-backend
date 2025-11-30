/********************************************************************************************
 * HEALTH CONTROLLER
 *
 * GET /api/health
 *
 * Returns:
 *   {
 *     "status": "ok",
 *     "timestamp": "2025-11-28T10:30:00.123Z",
 *     "service": "ziva-bi-backend",
 *     "uptime": 123.45
 *   }
 ********************************************************************************************/

import { Controller, Get } from '@nestjs/common';

@Controller('api/health')
export class HealthController {
  private readonly serviceStartedAt = Date.now();

  @Get()
  healthCheck() {
    return {
      status: 'ok',
      service: 'ziva-bi-backend',
      timestamp: new Date().toISOString(),
      uptime: (Date.now() - this.serviceStartedAt) / 1000,
    };
  }
}