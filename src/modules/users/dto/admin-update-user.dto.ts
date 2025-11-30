/********************************************************************************************
 * ADMIN UPDATE USER DTO
 *
 * Allowed only for:
 * - Tenant Admin
 * - Global Super Admin
 *
 * Can deactivate user, activate user, or update metadata.
 *********************************************************************************************/

import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AdminUpdateUserDto {
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  job_title?: string;

  @IsOptional()
  @IsString()
  department?: string;
}