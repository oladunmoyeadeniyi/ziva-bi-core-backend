// hash.util.ts
/**
 * Utilities for hashing and comparing:
 * - password hashing using argon2
 * - refresh token hashing using HMAC-SHA256 (fast lookup)
 * - OTP hashing using HMAC-SHA256
 *
 * Security decisions:
 * - Passwords: argon2 (slow hashing, adaptive)
 * - Refresh tokens / OTPs: hash with HMAC secret to avoid storing raw tokens but allow fast comparison.
 */

import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { AUTH } from '../constants';

export const HashUtil = {
  // Password (argon2)
  async hashPassword(plain: string) {
    return argon2.hash(plain);
  },

  async verifyPassword(hash: string, plain: string) {
    return argon2.verify(hash, plain);
  },

  // HMAC-SHA256 (for refresh tokens and OTP)
  hmac(value: string, secret = AUTH.REFRESH_HASH_SECRET) {
    return crypto.createHmac('sha256', secret).update(value).digest('hex');
  },

  // HMAC for OTP specifically (separate secret)
  hmacOtp(value: string, secret = AUTH.OTP_HASH_SECRET) {
    return crypto.createHmac('sha256', secret).update(value).digest('hex');
  },
};