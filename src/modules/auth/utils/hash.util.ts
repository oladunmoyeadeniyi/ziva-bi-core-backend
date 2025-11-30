// src/modules/auth/utils/hash.util.ts
import * as argon2 from 'argon2';

/**
 * Hash and verify helpers using argon2
 * - production use: keep argon2 defaults
 */

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  return argon2.verify(hash, plain);
}
