// src/modules/auth/constants.ts
export const AUTH_CONFIG = {
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',    // Access token lifetime
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '30d',  // Refresh token lifetime
  JWT_SECRET: process.env.JWT_SECRET || 'please-change-this-secret',
  REFRESH_TOKEN_TTL_DAYS: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '30', 10),
};
