/********************************************************************************************
 * PERFORM PASSWORD RESET DTO
 *
 * Step 2: User submits token + new password.
 * Token is hashed and verified against DB.
 *********************************************************************************************/

import { IsNotEmpty, MinLength } from 'class-validator';

export class PerformPasswordResetDto {
  @IsNotEmpty()
  token: string;

  @MinLength(8)
  new_password: string;
}