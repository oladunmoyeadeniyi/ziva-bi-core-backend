// constants.ts
// Shared constants for Auth module. Use env vars where appropriate.

export const AUTH = {
  ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'replace-with-secure-secret',
  ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  REFRESH_HASH_SECRET: process.env.REFRESH_TOKEN_HASH_SECRET || 'replace-refresh-hash-secret',
  OTP_HASH_SECRET: process.env.OTP_HASH_SECRET || 'replace-otp-hash-secret',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
};