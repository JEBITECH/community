import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { User, Membership } from '@shared/entities';
import { GuestInfoDto } from '../dto/guest-info.dto';

/**
 * Resolves an unauthenticated /public/* caller into a real Membership,
 * creating a User + external Membership on first contact. Identity is keyed
 * on phone (unique, required) rather than email (optional) — a guest who
 * registers for two events with the same phone becomes the same person,
 * reusing their existing external Membership via the (user_id, org_id)
 * uniqueness already enforced on Membership.
 */
@Injectable()
export class GuestMembershipResolverService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Membership) private readonly membershipRepo: Repository<Membership>,
  ) {}

  async resolve(organizationId: number, guest: GuestInfoDto): Promise<Membership> {
    let user = await this.userRepo.findOne({ where: { phone: guest.phone } });
    if (!user) {
      if (guest.email) {
        const emailTaken = await this.userRepo.findOne({ where: { email: guest.email } });
        if (emailTaken) {
          throw new ApiError('This email is already registered — please log in instead.', 409, 'EMAIL_ALREADY_IN_USE');
        }
      }
      user = await this.userRepo.save(
        this.userRepo.create({
          firstName: guest.first_name,
          lastName: guest.last_name,
          phone: guest.phone,
          email: guest.email ?? null,
          isActive: true,
          external_user: true,
          phone_verified: false,
        }),
      );
    }

    let membership = await this.membershipRepo.findOne({ where: { user_id: user.id!, organization_id: organizationId } });
    if (!membership) {
      membership = await this.membershipRepo.save(
        this.membershipRepo.create({
          user_id: user.id!,
          organization_id: organizationId,
          role: 'external_member',
          member_type: 'external',
          status: 'active',
          directory_visible: false,
          is_default: false,
          joined_at: new Date(),
        }),
      );
    }
    return membership;
  }
}
