import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { Membership } from '@shared/entities';
import { RequestUser } from '../middleware/user-context.middleware';

/** Resolves the caller's Membership row in their currently-active org — the
 * JWT carries organizationId/role but not membershipId, so this is derived
 * fresh on every call rather than trusted from a token claim. Shared across
 * every module that needs "who is the acting member" (participations,
 * donations, sponsorships, volunteering, ...). */
@Injectable()
export class MembershipResolverService {
  constructor(@InjectRepository(Membership) private readonly membershipRepo: Repository<Membership>) {}

  async resolve(user: RequestUser): Promise<Membership> {
    if (user.organization_id == null) {
      throw new ApiError('An active organization membership is required', 403, 'NO_ACTIVE_ORG');
    }
    const membership = await this.membershipRepo.findOne({
      where: { user_id: user.id, organization_id: user.organization_id, status: 'active' },
    });
    if (!membership) {
      throw new ApiError('No active membership found for this organization', 403, 'NO_ACTIVE_ORG');
    }
    return membership;
  }
}
