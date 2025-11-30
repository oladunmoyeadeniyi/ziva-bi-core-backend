/********************************************************************************************
 * VERIFY EMAIL DTO
 *
 * User clicks email link:
 *   /auth/verify?token=...
 *********************************************************************************************/

import { IsNotEmpty } from 'class-validator';

export class VerifyEmailDto {
  @IsNotEmpty()
  token: string;
}