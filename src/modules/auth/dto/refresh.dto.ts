import { IsString, IsOptional } from 'class-validator';

export class RefreshDto {
  @IsString()
  refreshToken: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}