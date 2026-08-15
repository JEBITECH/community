import { IsUUID } from 'class-validator';

export class ReassignVolunteerAssignmentDto {
  @IsUUID()
  volunteer_role_id!: string;
}
