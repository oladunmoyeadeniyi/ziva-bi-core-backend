/********************************************************************************************
 * LOGIN DTO
 *
 * Supports:
 * - Email + Password login
 * - Multi-tenant context optional (tenant chosen at login)
 *********************************************************************************************/

import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;

  /** Optional tenant selection at login */
  tenant_id?: string;
}