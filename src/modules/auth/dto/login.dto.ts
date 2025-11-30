// src/modules/auth/dto/login.dto.ts
import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  // Optional client metadata (device id / ip) - useful for refresh token session tracking
  @IsOptional()
  @IsString()
  device?: string;
}
