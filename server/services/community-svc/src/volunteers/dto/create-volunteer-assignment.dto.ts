import { IsUUID } from 'class-validator';

export class CreateVolunteerAssignmentDto {
  @IsUUID()
  volunteer_role_id!: string;
}
