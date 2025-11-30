import { IsString, IsOptional } from 'class-validator';

export class OtpGenerateDto {
  @IsString()
  subject: string; // email or phone

  @IsString()
  purpose: string; // e.g. 'login', 'reset-password'

  @IsOptional()
  @IsString()
  tenant_id?: string;
}

export class OtpVerifyDto {
  @IsString()
  subject: string;

  @IsString()
  purpose: string;

  @IsString()
  code: string;
}