import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { Membership, User } from '@shared/entities';
import { UpdateMemberDto } from './dto/update-member.dto';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';
import { NotificationClientService } from '../common/services/notification-client.service';

const ADMIN_ROLES = ['super_admin', 'core_committee', 'master_admin'];

export interface DirectoryEntry {
  membership_id: string;
  first_name: string;
  last_name?: string;
  unit_identifier?: string;
  role: string;
  member_type: string;
  status: string;
  joined_at?: Date;
  phone?: string;
  email?: string | null;
}

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Membership) private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly notificationClient: NotificationClientService,
  ) {}

  private assertOrgScoped(user: RequestUser): number {
    if (user.organization_id == null) {
      throw new ApiError('An active organization membership is required', 403, 'NO_ACTIVE_ORG');
    }
    return user.organization_id;
  }

  async findDirectory(user: RequestUser): Promise<DirectoryEntry[]> {
    const organizationId = this.assertOrgScoped(user);
    const memberships = await this.membershipRepo.find({
      where: { organization_id: organizationId, status: 'active', directory_visible: true },
      order: { createdAt: 'ASC' },
    });
    return this.buildEntries(memberships, false);
  }

  async findPending(user: RequestUser): Promise<DirectoryEntry[]> {
    const organizationId = this.assertOrgScoped(user);
    const memberships = await this.membershipRepo.find({ where: { organization_id: organizationId, status: 'pending' }, order: { createdAt: 'ASC' } });
    return this.buildEntries(memberships, true);
  }

  async findOne(membershipId: string, user: RequestUser): Promise<DirectoryEntry> {
    const membership = await this.membershipRepo.findOne({ where: { id: membershipId } });
    if (!membership) {
      throw new ApiError('Member not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(membership.organization_id, user);

    const isAdmin = ADMIN_ROLES.includes(user.role);
    const isSelf = membership.user_id === user.id;
    if (!isAdmin && !isSelf && !membership.directory_visible) {
      throw new ApiError('This member is not visible in the directory', 403, 'FORBIDDEN');
    }

    const [entry] = await this.buildEntries([membership], isAdmin || isSelf);
    return entry;
  }

  async update(membershipId: string, user: RequestUser, dto: UpdateMemberDto): Promise<Membership> {
    const membership = await this.membershipRepo.findOne({ where: { id: membershipId } });
    if (!membership) {
      throw new ApiError('Member not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(membership.organization_id, user);
    Object.assign(membership, dto);
    return this.membershipRepo.save(membership);
  }

  async approve(membershipId: string, user: RequestUser): Promise<Membership> {
    const membership = await this.loadPending(membershipId, user);
    membership.status = 'active';
    membership.approved_by_user_id = user.id;
    membership.joined_at = membership.joined_at ?? new Date();
    const saved = await this.membershipRepo.save(membership);

    this.notificationClient.send({
      eventType: 'community.membership_approved',
      organizationId: saved.organization_id,
      recipientId: saved.user_id,
      title: "You're in!",
      body: 'Your membership request has been approved. Welcome to the community.',
    });

    return saved;
  }

  async reject(membershipId: string, user: RequestUser): Promise<Membership> {
    const membership = await this.loadPending(membershipId, user);
    membership.status = 'rejected';
    membership.approved_by_user_id = user.id;
    return this.membershipRepo.save(membership);
  }

  private async loadPending(membershipId: string, user: RequestUser): Promise<Membership> {
    const membership = await this.membershipRepo.findOne({ where: { id: membershipId } });
    if (!membership) {
      throw new ApiError('Member not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(membership.organization_id, user);
    if (membership.status !== 'pending') {
      throw new ApiError(`Cannot approve/reject a membership with status "${membership.status}"`, 409, 'INVALID_STATUS_TRANSITION');
    }
    return membership;
  }

  private async buildEntries(memberships: Membership[], includeContact: boolean): Promise<DirectoryEntry[]> {
    if (memberships.length === 0) return [];
    const userIds = [...new Set(memberships.map((m) => m.user_id))];
    const users = await this.userRepo.find({ where: { id: In(userIds) } });
    const userById = new Map(users.map((u) => [u.id, u]));

    return memberships.map((m) => {
      const u = userById.get(m.user_id);
      const entry: DirectoryEntry = {
        membership_id: m.id,
        first_name: u?.firstName || 'Member',
        last_name: u?.lastName,
        unit_identifier: m.unit_identifier,
        role: m.role,
        member_type: m.member_type,
        status: m.status,
        joined_at: m.joined_at,
      };
      if (includeContact) {
        entry.phone = u?.phone;
        entry.email = u?.email;
      }
      return entry;
    });
  }
}
