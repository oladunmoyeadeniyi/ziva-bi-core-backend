/**
 * Auth module constants
 *
 * Keep small tenant-agnostic defaults here. Tenants can override via tenant settings.
 */

export const AUTH_DEFAULTS = {
  OTP: {
    DIGITS: 6,
    TTL_SECONDS: 10 * 60, // 10 minutes
    MAX_ATTEMPTS: 5,
  },

  REFRESH_TOKEN: {
    // refresh token TTL default for DB records (in seconds) - 30 days
    TTL_SECONDS: 30 * 24 * 60 * 60,
    HASH_SALT_ROUNDS: 3, // used by argon2 config in helper (informational)
  },

  ACCESS_TOKEN: {
    // just informational default if not present in env
    EXPIRES: '15m',
  },

  MESSAGES: {
    OTP_EXPIRED: 'OTP code expired or invalid',
    OTP_INVALID: 'OTP invalid',
    REFRESH_INVALID: 'Refresh token invalid or revoked',
    SESSION_REVOKED: 'Session revoked',
  },
};