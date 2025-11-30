/**
 * UsersModule
 *
 * - Registers User and UserTenant entities
 * - Provides UsersService and UsersController
 * - Exports UsersService for other modules (TenantService, AuthService)
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UserTenant } from './entities/user-tenant.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserTenant])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}