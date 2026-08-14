import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { AreaType } from '../../enums/area-type.enum';
import { CheckListStatus } from '../../enums/checklist-status.enum';
import { InspectionStatus } from '../../enums/inspection-status.enum';
import { Image } from './image.dto';

export class CreateActiveTaskChecklistDto {
  @ApiProperty()
  @IsInt()
  checklist_id!: number;

  @ApiProperty()
  @IsString()
  checklist_title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checklist_code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsInt()
  task_id!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  task_rule_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  unit_area_id?: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  cat_element_id?: number[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  cat_amentity_id?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  cat_product_id?: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  all_cat_ids?: number[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  checklist_condition?: string[];

  @ApiPropertyOptional({ type: () => [Image] })
  @IsOptional()
  @IsArray()
  checklist_images?: Image[];

  @ApiPropertyOptional({ type: () => [Image] })
  @IsOptional()
  @IsArray()
  checklist_videos?: Image[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  selected_checklist_condition?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_guest_selected?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category_type?: string;

  @ApiProperty({ enum: AreaType })
  @IsEnum(AreaType)
  area_type?: AreaType;

  @ApiProperty({
    enum: CheckListStatus,
    default: CheckListStatus.Pending,
  })
  @IsEnum(CheckListStatus)
  checklist_status!: CheckListStatus;

  @ApiProperty({
    enum: InspectionStatus,
    default: InspectionStatus.Pending,
  })
  @IsEnum(InspectionStatus)
  inspection_status!: InspectionStatus;
}
