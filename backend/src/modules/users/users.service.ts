import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findByEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) return null;

    const staffRoles = await this.usersRepository.findStaffRoles(user.id);
    return { ...user, staffRoles };
  }

  async findById(userId: string) {
    return this.usersRepository.findById(userId);
  }
}
