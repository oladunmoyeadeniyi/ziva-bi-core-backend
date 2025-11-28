// login.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  // Accept email OR phone as login identifier
  @IsOptional()
  @IsString()
  loginEmail?: string;

  @IsOptional()
  @IsString()
  loginPhone?: string;

  @IsNotEmpty()
  @IsString()
  password!: string;

  // tenant context is required to locate tenant-scoped user
  @IsNotEmpty()
  @IsString()
  tenantId!: string;

  // Optional device fingerprint for trusted devices
  @IsOptional()
  @IsString()
  deviceFingerprint?: string;
}