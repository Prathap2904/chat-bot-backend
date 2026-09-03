import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { AccessRole } from '../users/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  accessRole: AccessRole;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    accessRole: AccessRole;
    role: string; // chat persona – included for client convenience
    status: string;
    avatar: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponse> {
    // 1. Find user by email (includes passwordHash for comparison only)
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Constant-time bcrypt comparison – never compare plain strings
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Build JWT payload – passwordHash is intentionally excluded
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      accessRole: user.accessRole,
    };

    const accessToken = this.jwtService.sign(payload);

    // 4. Return token + safe user info – passwordHash is intentionally excluded
    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        accessRole: user.accessRole,
        role: user.role, // chat persona – unchanged, returned for client use
        status: user.status,
        avatar: user.avatar,
      },
    };
  }
}
