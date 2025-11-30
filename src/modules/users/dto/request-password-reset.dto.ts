/********************************************************************************************
 * REQUEST PASSWORD RESET DTO
 *
 * Step 1: User enters email.
 * A secure reset token will be emailed.
 *********************************************************************************************/

import { IsEmail } from 'class-validator';

export class RequestPasswordResetDto {
  @IsEmail()
  email: string;
}