import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { InspectionStatus } from '../../enums/inspection-status.enum';
import { RateUnit } from '../../enums/rate-unit.enum';
import { TaskPriority } from '../../enums/task-priority.enum';
import { TaskStatus } from '../../enums/task-status.enum';
import { TaskType } from '../../enums/task-type.enum';
import { CreateActiveTaskChecklistDto } from './create-active-task-checklist.dto';
import { Cost } from '../../cost.entity';
import { TaskChecklistImage } from '../../task-checklist-image.entity';
import { Image } from './image.dto';
import { CreateAdditionalCostDto } from './create-additional.cost.dto';

export class CreateTaskDto {
  @ApiProperty()
  @IsString()
  task_title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  task_description?: string;

  @ApiProperty({ enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @ApiProperty({ enum: TaskType })
  @IsEnum(TaskType)
  task_type!: TaskType;

  @ApiProperty()
  @IsInt()
  unit_id!: number;

  @ApiProperty()
  @IsInt()
  unit_type_id!: number;

  @ApiProperty()
  @IsInt()
  property_id!: number;

  @ApiProperty()
  @IsInt()
  organization_id!: number;

  @ApiProperty()
  @IsString()
  created_by_id!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assigned_to_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inspected_by_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  assigned_to_team_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  vendor_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  template_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  issue_category_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  issue_type_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  estimated_time?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  expected_completion_minutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  started_at?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expected_completion_at?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rate_amount?: number;

  @ApiProperty({ enum: RateUnit, default: RateUnit.HOURLY })
  @IsEnum(RateUnit)
  rate_unit?: RateUnit;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pet_present?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  remote_inspection?: boolean;

  @ApiPropertyOptional({ enum: InspectionStatus })
  @IsOptional()
  @IsEnum(InspectionStatus)
  inspection_status?: InspectionStatus;

  @ApiPropertyOptional({ enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  linkedreservation?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  due_at?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  due_time?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sequence?: number;

  @ApiPropertyOptional({ type: () => [Image] })
  @IsOptional()
  @IsArray()
  reference_images?: Image[];

  @ApiPropertyOptional({ type: () => [CreateActiveTaskChecklistDto] })
  active_task_checklists?: CreateActiveTaskChecklistDto[];

  @ApiPropertyOptional()
  additional_costs?: CreateAdditionalCostDto[];

  @IsOptional()
  @ApiPropertyOptional()
  cost?: Cost;

  @IsOptional()
  @ApiPropertyOptional()
  checklist_image?: TaskChecklistImage;

  @ApiPropertyOptional()
  task_template_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_approved?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  is_guest_task?: boolean;

  @ApiProperty({ default: false })
  is_recurring!: boolean;

  @ApiPropertyOptional()
  rrulestr?: string;

  @ApiPropertyOptional()
  element_id?: number;

  @ApiProperty({ default: false })
  is_owner_inspector!: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  ai_executor_assignment?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  auto_submit_detection?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  auto_submit_difference?: boolean;
}
