import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessRole } from '../users/user.entity';
import { ROLES_KEY } from './roles.decorator';
import { AuthenticatedUser } from './jwt.strategy';

/**
 * RolesGuard
 *
 * Must ALWAYS run AFTER JwtAuthGuard, because it depends on
 * `request.user` being populated by JwtStrategy.validate().
 *
 * Apply both guards together:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(AccessRole.ADMIN)
 *
 * Authorization flow:
 *   1. Read required roles from @Roles() metadata via Reflector.
 *   2. If no @Roles() metadata is present, the route is allowed for
 *      any authenticated user (pass-through).
 *   3. Read the authenticated user's accessRole from request.user
 *      (set by JwtStrategy.validate()).
 *   4. If user's accessRole is in the required list → ALLOW (200/handler runs).
 *   5. If user's accessRole is NOT in the required list → DENY (403 Forbidden).
 *
 * NOTE: Authorization is based EXCLUSIVELY on accessRole (ADMIN / MANAGER / USER).
 *       The `role` field (chatbot persona / job title) is NOT used here and must
 *       NOT be used for authorization anywhere in this codebase.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Read the required roles from the @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<AccessRole[]>(
      ROLES_KEY,
      [
        context.getHandler(), // method-level decorator takes precedence
        context.getClass(), // fallback to controller-level decorator
      ],
    );

    // 2. No @Roles() metadata → pass-through for any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 3. Get the authenticated user from request.user (set by JwtAuthGuard)
    const request = context.switchToHttp().getRequest<{
      user: AuthenticatedUser;
    }>();
    const user = request.user;

    // 4. Check whether the user's accessRole satisfies the required roles
    const hasRole = requiredRoles.includes(user.accessRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required role(s): ${requiredRoles.join(', ')}. ` +
          `Your role: ${user.accessRole}.`,
      );
    }

    return true;
  }
}
