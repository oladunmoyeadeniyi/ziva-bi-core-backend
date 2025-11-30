/********************************************************************************************
 * UPDATE USER PROFILE DTO
 *
 * This does NOT change:
 * - Email
 * - Password
 * - Tenant assignment
 *
 * Only profile metadata.
 *********************************************************************************************/

import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
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

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsString()
  employee_code?: string;
}