import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'community_roles';

/** Coarse role gate for admin-surface endpoints (member-facing endpoints should
 * rely on tenant + ownership checks instead, per the community-svc design). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
