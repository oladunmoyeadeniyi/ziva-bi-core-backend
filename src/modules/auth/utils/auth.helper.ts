/**
 * Auth helpers
 *
 * Purpose:
 * - provide small reusable utilities used by AuthService and controllers
 * - keep low-level crypto + token helpers here so they can be unit-tested easily
 *
 * NOTE: We use argon2 for hashing sensitive tokens (refresh tokens) and node's crypto for
 * random generation of OTP codes. Argon2 is recommended for password-like secrets.
 */

import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import { promisify } from 'util';

const randomBytesAsync = promisify(crypto.randomBytes);

/**
 * Generate a human-friendly numeric OTP code.
 * Implementation: generate secure random bytes and map to digits.
 *
 * @param digits number of digits (default 6)
 * @returns string e.g. "492813"
 */
export async function generateNumericOtp(digits = 6): Promise<string> {
  if (digits <= 0 || digits > 12) throw new Error('digits must be 1..12');
  // generate enough bytes
  const bytes = await randomBytesAsync(Math.ceil(digits / 2));
  // convert to hex and then map to digits
  const hex = bytes.toString('hex');
  // take last `digits` characters mapped to 0-9
  let result = '';
  for (let i = 0; result.length < digits && i < hex.length; i++) {
    const code = parseInt(hex[i], 16) % 10;
    result += String(code);
  }
  // fallback trim/pad if necessary
  if (result.length < digits) {
    result = result.padStart(digits, '0');
  }
  return result.slice(0, digits);
}

/**
 * Hash a token with Argon2id and return encoded string suitable for DB storage.
 * We use argon2id with reasonable defaults for production.
 */
export async function hashToken(plain: string): Promise<string> {
  return argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1,
  });
}

/**
 * Verify a token against an Argon2 hash.
 * Returns true if match.
 */
export async function verifyTokenHash(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch (err) {
    // treat verification errors as non-match
    return false;
  }
}

/**
 * Normalize subject strings (emails, phone numbers) to a canonical form for storage/lookup.
 * For email - lowercases and trims.
 * For phone numbers - consumer should call a separate normalization (libphonenumber) if needed.
 */
export function normalizeSubject(subject: string): string {
  if (!subject) return subject;
  return subject.trim().toLowerCase();
}