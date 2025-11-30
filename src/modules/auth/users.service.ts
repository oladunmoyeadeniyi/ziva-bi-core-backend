// src/modules/auth/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async create(user: Partial<User>): Promise<User> {
    const u = this.userRepo.create(user);
    return this.userRepo.save(u);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User> {
    const u = await this.userRepo.findOne({ where: { id } });
    if (!u) throw new NotFoundException('User not found');
    return u;
  }
}
