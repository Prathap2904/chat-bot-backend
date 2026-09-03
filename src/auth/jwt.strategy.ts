import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AccessRole } from '../users/user.entity';

/**
 * Shape of the validated JWT payload after signature/expiry checks pass.
 * This becomes `request.user` in any route protected by JwtAuthGuard.
 *
 * Note: `role` (chatbot persona) is NOT in the token and is NOT here.
 * `accessRole` is the application RBAC field only.
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  accessRole: AccessRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Read token from:  Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Reject expired tokens – do NOT set ignoreExpiration: true
      ignoreExpiration: false,

      // Secret must match the one used in JwtModule (auth.module.ts)
      secretOrKey: configService.get<string>('JWT_SECRET', 'MISSING_JWT_SECRET_SET_ENV'),
    });
  }

  /**
   * Called by Passport AFTER it has already:
   *   1. Extracted the token from the Authorization header
   *   2. Verified the HMAC signature against JWT_SECRET
   *   3. Verified the token has not expired
   *
   * Whatever this method returns is set as `request.user`.
   * We rename `sub` → `userId` for clarity.
   * We do NOT re-query the database here – the signed token is the source of truth.
   */
  async validate(payload: {
    sub: string;
    email: string;
    accessRole: AccessRole;
  }): Promise<AuthenticatedUser> {
    return {
      userId: payload.sub,
      email: payload.email,
      accessRole: payload.accessRole,
    };
  }
}
