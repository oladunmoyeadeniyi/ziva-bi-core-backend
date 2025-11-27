/**
 * ================================================================
 * Ziva BI — Health Controller
 * ----------------------------------------------------------------
 * Purpose:
 *   - Provides a basic route to verify the backend is running
 *   - Render uses this to detect readiness
 *
 * URL:
 *   GET /api/health
 * ================================================================
 */

import { Controller, Get } from '@nestjs/common';

@Controller('health')
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