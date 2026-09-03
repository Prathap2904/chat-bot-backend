import { SetMetadata } from '@nestjs/common';
import { AccessRole } from '../users/user.entity';

/**
 * Metadata key used by RolesGuard to read the required roles
 * from the route handler's decorator metadata.
 */
export const ROLES_KEY = 'roles';

/**
 * @Roles() decorator
 *
 * Attach required AccessRole values to a route handler or controller.
 * Must always be paired with BOTH JwtAuthGuard AND RolesGuard.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 *   @Roles(AccessRole.ADMIN)
 *   @Get('admin-only')
 *   adminRoute() { ... }
 *
 *   @Roles(AccessRole.ADMIN, AccessRole.MANAGER)
 *   @Get('managers-and-above')
 *   managersRoute() { ... }
 *
 * NOTE: This decorator operates ONLY on accessRole (RBAC).
 *       It has nothing to do with the `role` field (chatbot persona/job title).
 */
export const Roles = (...roles: AccessRole[]) => SetMetadata(ROLES_KEY, roles);
