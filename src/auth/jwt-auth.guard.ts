import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard
 *
 * Apply to any route handler or controller with:
 *   @UseGuards(JwtAuthGuard)
 *
 * Effect:
 *   - Requires a valid  Authorization: Bearer <token>  header.
 *   - Returns 401 Unauthorized if the token is missing, expired, or has an invalid signature.
 *   - Populates `request.user` with the AuthenticatedUser from JwtStrategy.validate()
 *     on successful validation.
 *
 * Does NOT perform any role-level authorization (RolesGuard is a separate, future step).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
