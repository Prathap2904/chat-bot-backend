import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService, User } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * GET /users
   *
   * Protected: requires a valid JWT in the Authorization: Bearer header.
   * Returns 401 Unauthorized if the token is missing, expired, or invalid.
   * Returns the list of team members (passwordHash excluded automatically
   * because it is not selected by findAll() and is not in the User DTO).
   */
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<User[]> {
    return await this.usersService.findAll();
  }
}
