/********************************************************************************************
 * ADD USER TO TENANT DTO
 *
 * Used by Tenant Admin to assign a user into their organization.
 *********************************************************************************************/

import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddUserToTenantDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsUUID()
  @IsNotEmpty()
  tenant_id: string;
}