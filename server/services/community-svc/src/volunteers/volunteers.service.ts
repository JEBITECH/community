import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ApiError } from '@shared/common';
import { Membership } from '@shared/entities';
import { Event } from '../events/entities/event.entity';
import { EventComponent } from '../events/entities/event-component.entity';
import { Participation } from '../participations/entities/participation.entity';
import { VolunteerRole } from './entities/volunteer-role.entity';
import { VolunteerAssignment } from './entities/volunteer-assignment.entity';
import { CreateVolunteerRoleDto } from './dto/create-volunteer-role.dto';
import { CreateVolunteerAssignmentDto } from './dto/create-volunteer-assignment.dto';
import { ReassignVolunteerAssignmentDto } from './dto/reassign-volunteer-assignment.dto';
import { RequestUser } from '../common/middleware/user-context.middleware';
import { assertTenantMatch } from '../common/helpers/tenant.helper';
import { MembershipResolverService } from '../common/services/membership-resolver.service';
import { NotificationClientService } from '../common/services/notification-client.service';

const POSTGRES_UNIQUE_VIOLATION = '23505';
const ADMIN_ROLES = ['super_admin', 'core_committee', 'master_admin'];

@Injectable()
export class VolunteersService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly membershipResolver: MembershipResolverService,
    private readonly notificationClient: NotificationClientService,
    @InjectRepository(Event) private readonly eventRepo: Repository<Event>,
    @InjectRepository(EventComponent) private readonly componentRepo: Repository<EventComponent>,
    @InjectRepository(Participation) private readonly participationRepo: Repository<Participation>,
    @InjectRepository(VolunteerRole) private readonly roleRepo: Repository<VolunteerRole>,
    @InjectRepository(VolunteerAssignment) private readonly assignmentRepo: Repository<VolunteerAssignment>,
    @InjectRepository(Membership) private readonly membershipRepo: Repository<Membership>,
  ) {}

  async createRole(user: RequestUser, dto: CreateVolunteerRoleDto): Promise<VolunteerRole> {
    const event = await this.eventRepo.findOne({ where: { id: dto.event_id } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(event.organization_id, user);

    if (dto.event_component_id) {
      const component = await this.componentRepo.findOne({ where: { id: dto.event_component_id } });
      if (!component) {
        throw new ApiError('Component not found', 404, 'NOT_FOUND');
      }
      assertTenantMatch(component.organization_id, user);
    }

    const role = this.roleRepo.create({
      organization_id: event.organization_id,
      event_id: event.id,
      event_component_id: dto.event_component_id,
      title: dto.title,
      description: dto.description,
      slot_start: dto.slot_start,
      slot_end: dto.slot_end,
      headcount_needed: dto.headcount_needed,
      kind: dto.kind ?? 'volunteer',
      headcount_filled: 0,
      status: 'open',
    });
    return this.roleRepo.save(role);
  }

  async findRolesForEvent(eventId: string, user: RequestUser): Promise<VolunteerRole[]> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new ApiError('Event not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(event.organization_id, user);
    return this.roleRepo.find({ where: { event_id: eventId }, order: { createdAt: 'ASC' } });
  }

  async findAssignmentsForRole(roleId: string, user: RequestUser): Promise<VolunteerAssignment[]> {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) {
      throw new ApiError('Volunteer role not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(role.organization_id, user);
    return this.assignmentRepo.find({ where: { volunteer_role_id: roleId }, order: { createdAt: 'ASC' } });
  }

  async create(user: RequestUser, dto: CreateVolunteerAssignmentDto): Promise<VolunteerAssignment> {
    const membership = await this.membershipResolver.resolve(user);

    const role = await this.roleRepo.findOne({ where: { id: dto.volunteer_role_id } });
    if (!role) {
      throw new ApiError('Volunteer role not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(role.organization_id, user);
    if (role.status === 'closed') {
      throw new ApiError('This volunteer opportunity is closed', 409, 'ROLE_CLOSED');
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        // Lock the role row so two concurrent sign-ups can't both read
        // "1 slot free" and both insert, over-filling the role.
        await manager.query('SELECT id FROM volunteer_role WHERE id = $1 FOR UPDATE', [role.id]);
        const freshRole = await manager.findOne(VolunteerRole, { where: { id: role.id } });
        if (!freshRole) {
          throw new ApiError('Volunteer role not found', 404, 'NOT_FOUND');
        }
        if (freshRole.status === 'closed') {
          throw new ApiError('This volunteer opportunity is closed', 409, 'ROLE_CLOSED');
        }
        if (freshRole.headcount_filled >= freshRole.headcount_needed) {
          throw new ApiError('This volunteer opportunity is fully staffed', 409, 'SLOT_FULL');
        }

        const participation = await manager.save(
          manager.create(Participation, {
            organization_id: freshRole.organization_id,
            event_id: freshRole.event_id,
            event_component_id: freshRole.event_component_id ?? null,
            membership_id: membership.id,
            type: 'volunteer',
            status: 'active',
          }),
        );

        const assignment = await manager.save(
          manager.create(VolunteerAssignment, {
            participation_id: participation.id,
            volunteer_role_id: freshRole.id,
            membership_id: membership.id,
            approval_status: 'pending',
          }),
        );

        freshRole.headcount_filled += 1;
        if (freshRole.headcount_filled >= freshRole.headcount_needed) {
          freshRole.status = 'filled';
        }
        await manager.save(freshRole);

        return assignment;
      });
    } catch (err: any) {
      if (err?.code === POSTGRES_UNIQUE_VIOLATION) {
        throw new ApiError('You have already signed up for this volunteer role', 409, 'ALREADY_VOLUNTEERED');
      }
      throw err;
    }
  }

  async findMine(user: RequestUser): Promise<(VolunteerAssignment & { event_id: string; event_name: string; role_title: string })[]> {
    const membership = await this.membershipResolver.resolve(user);
    const { entities, raw } = await this.assignmentRepo
      .createQueryBuilder('a')
      .innerJoin(Participation, 'p', 'p.id = a.participation_id')
      .innerJoin(Event, 'e', 'e.id = p.event_id')
      .innerJoin(VolunteerRole, 'r', 'r.id = a.volunteer_role_id')
      .addSelect(['p.event_id AS event_id', 'e.name AS event_name', 'r.title AS role_title'])
      .where('a.membership_id = :membershipId', { membershipId: membership.id })
      .orderBy('a.createdAt', 'DESC')
      .getRawAndEntities();

    return entities.map((assignment, i) => ({
      ...assignment,
      event_id: raw[i].event_id,
      event_name: raw[i].event_name,
      role_title: raw[i].role_title,
    }));
  }

  private async loadWithContext(
    id: string,
    user: RequestUser,
  ): Promise<{ assignment: VolunteerAssignment; participation: Participation; role: VolunteerRole }> {
    const assignment = await this.assignmentRepo.findOne({ where: { id } });
    if (!assignment) {
      throw new ApiError('Volunteer assignment not found', 404, 'NOT_FOUND');
    }
    const participation = await this.participationRepo.findOne({ where: { id: assignment.participation_id } });
    const role = await this.roleRepo.findOne({ where: { id: assignment.volunteer_role_id } });
    if (!participation || !role) {
      throw new ApiError('Volunteer assignment not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(participation.organization_id, user);
    return { assignment, participation, role };
  }

  /** Frees a slot on a role — used by both reject and cancel, which have
   * identical "give the seat back" semantics but different callers/guards. */
  private async releaseSlot(manager: EntityManager, roleId: string): Promise<void> {
    await manager.query('SELECT id FROM volunteer_role WHERE id = $1 FOR UPDATE', [roleId]);
    const role = await manager.findOne(VolunteerRole, { where: { id: roleId } });
    if (role) {
      role.headcount_filled = Math.max(0, role.headcount_filled - 1);
      if (role.status === 'filled') {
        role.status = 'open';
      }
      await manager.save(role);
    }
  }

  async approve(id: string, user: RequestUser): Promise<VolunteerAssignment> {
    const { assignment, role } = await this.loadWithContext(id, user);
    if (assignment.approval_status !== 'pending') {
      throw new ApiError(`Cannot approve an assignment with status "${assignment.approval_status}"`, 409, 'INVALID_STATUS_TRANSITION');
    }
    assignment.approval_status = 'approved';
    assignment.approved_by_user_id = user.id;
    assignment.approved_at = new Date();
    const saved = await this.assignmentRepo.save(assignment);
    await this.notifyVolunteer(assignment.membership_id, role.title, 'approved');
    return saved;
  }

  /** Fire-and-forget — resolves the assignment's membership to a user id and
   * notifies them of an approve/reject decision. Never throws: a lookup miss
   * or notification-svc outage must not block the admin action that triggered it. */
  private async notifyVolunteer(membershipId: string, roleTitle: string, decision: 'approved' | 'rejected'): Promise<void> {
    const membership = await this.membershipRepo.findOne({ where: { id: membershipId } });
    if (!membership) return;
    this.notificationClient.send({
      eventType: `community.volunteer_${decision}`,
      organizationId: membership.organization_id,
      recipientId: membership.user_id,
      title: decision === 'approved' ? `You're confirmed for "${roleTitle}"` : `Your sign-up for "${roleTitle}" wasn't approved`,
      body:
        decision === 'approved'
          ? `Your volunteer sign-up for "${roleTitle}" has been approved. Thank you for helping out!`
          : `Your volunteer sign-up for "${roleTitle}" was not approved this time. The slot has been freed up.`,
    });
  }

  async reject(id: string, user: RequestUser): Promise<VolunteerAssignment> {
    const { assignment, participation, role } = await this.loadWithContext(id, user);
    if (assignment.approval_status === 'rejected') {
      throw new ApiError('This assignment has already been rejected', 409, 'INVALID_STATUS_TRANSITION');
    }

    const saved = await this.dataSource.transaction(async (manager) => {
      assignment.approval_status = 'rejected';
      assignment.approved_by_user_id = user.id;
      assignment.approved_at = new Date();
      const savedAssignment = await manager.save(assignment);

      participation.status = 'cancelled';
      await manager.save(participation);

      await this.releaseSlot(manager, assignment.volunteer_role_id);
      return savedAssignment;
    });
    await this.notifyVolunteer(assignment.membership_id, role.title, 'rejected');
    return saved;
  }

  async cancel(id: string, user: RequestUser): Promise<VolunteerAssignment> {
    const membership = await this.membershipResolver.resolve(user);
    const { assignment, participation } = await this.loadWithContext(id, user);

    const isOwner = participation.membership_id === membership.id;
    const isAdmin = ADMIN_ROLES.includes(user.role);
    if (!isOwner && !isAdmin) {
      throw new ApiError('You can only cancel your own sign-up', 403, 'FORBIDDEN');
    }
    if (participation.status !== 'active') {
      throw new ApiError(`Cannot cancel a sign-up with status "${participation.status}"`, 409, 'INVALID_STATUS_TRANSITION');
    }

    return this.dataSource.transaction(async (manager) => {
      participation.status = 'cancelled';
      await manager.save(participation);

      if (assignment.approval_status !== 'rejected') {
        await this.releaseSlot(manager, assignment.volunteer_role_id);
      }
      return assignment;
    });
  }

  async reassign(id: string, user: RequestUser, dto: ReassignVolunteerAssignmentDto): Promise<VolunteerAssignment> {
    const { assignment, participation, role: oldRole } = await this.loadWithContext(id, user);

    const newRole = await this.roleRepo.findOne({ where: { id: dto.volunteer_role_id } });
    if (!newRole) {
      throw new ApiError('Target volunteer role not found', 404, 'NOT_FOUND');
    }
    assertTenantMatch(newRole.organization_id, user);
    if (newRole.event_id !== oldRole.event_id) {
      throw new ApiError('Volunteers can only be reassigned within the same event', 409, 'ROLE_EVENT_MISMATCH');
    }
    if (newRole.id === oldRole.id) {
      return assignment;
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        // Lock both role rows in a fixed order (by id) to avoid deadlocking
        // against a concurrent reassignment moving the opposite direction.
        const [firstId, secondId] = [oldRole.id, newRole.id].sort();
        await manager.query('SELECT id FROM volunteer_role WHERE id = $1 FOR UPDATE', [firstId]);
        await manager.query('SELECT id FROM volunteer_role WHERE id = $1 FOR UPDATE', [secondId]);

        const freshNewRole = await manager.findOne(VolunteerRole, { where: { id: newRole.id } });
        const freshOldRole = await manager.findOne(VolunteerRole, { where: { id: oldRole.id } });
        if (!freshNewRole || !freshOldRole) {
          throw new ApiError('Volunteer role not found', 404, 'NOT_FOUND');
        }
        if (freshNewRole.status === 'closed') {
          throw new ApiError('This volunteer opportunity is closed', 409, 'ROLE_CLOSED');
        }
        if (freshNewRole.headcount_filled >= freshNewRole.headcount_needed) {
          throw new ApiError('This volunteer opportunity is fully staffed', 409, 'SLOT_FULL');
        }

        freshOldRole.headcount_filled = Math.max(0, freshOldRole.headcount_filled - 1);
        if (freshOldRole.status === 'filled') {
          freshOldRole.status = 'open';
        }
        await manager.save(freshOldRole);

        freshNewRole.headcount_filled += 1;
        if (freshNewRole.headcount_filled >= freshNewRole.headcount_needed) {
          freshNewRole.status = 'filled';
        }
        await manager.save(freshNewRole);

        assignment.volunteer_role_id = freshNewRole.id;
        const savedAssignment = await manager.save(assignment);

        participation.event_component_id = freshNewRole.event_component_id ?? null;
        await manager.save(participation);

        return savedAssignment;
      });
    } catch (err: any) {
      if (err?.code === POSTGRES_UNIQUE_VIOLATION) {
        throw new ApiError('This volunteer is already assigned to that role', 409, 'ALREADY_VOLUNTEERED');
      }
      throw err;
    }
  }
}
