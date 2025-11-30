/********************************************************************************************
 * REGISTER USER DTO
 *
 * Used by:
 * - Public registration (if tenant allows self-registration)
 * - Tenant admin creating a user account
 *********************************************************************************************/

import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty()
  full_name: string;

  @IsEmail()
  email: string;

  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  /** Optional: used when tenant admin is inviting user */
  tenant_id?: string;
}