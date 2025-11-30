/**
 * health.controller.ts
 * -------------------------------------------
 * Basic endpoint used by Render, CI pipelines,
 * and monitoring tools to confirm backend is alive.
 * -------------------------------------------
 */

import { Controller, Get } from '@nestjs/common';

@Controller('api/health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'ziva-bi-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
