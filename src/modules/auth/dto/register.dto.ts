// register.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * DTO: register a user (tenant-scoped)
 * - tenant signup / admin created user flows will use this
 */
export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  displayName!: string;

  @IsEmail()
  loginEmail!: string;

  @IsOptional()
  @IsString()
  loginPhone?: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  /**
   * tenantId expected for tenant-scoped creation.
   * For self-signup flows tenant_creation is separate and out of scope here.
   */
  @IsString()
  tenantId!: string;
}