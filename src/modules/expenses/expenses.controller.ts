// src/modules/expenses/expenses.controller.ts (snippet)
import { Controller, Post, UseGuards, Body } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/modules/rbac/permissions.guard';
import { Permissions } from 'src/modules/rbac/permissions.decorator';

@Controller('expenses')
export class ExpensesController {
  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('expenses.create')
  async create(@Body() dto: any) {
    // create logic
    return { ok: true };
  }
}