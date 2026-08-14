import { ApiProperty } from '@nestjs/swagger';

export class CreateAdditionalCostDto {
  @ApiProperty()
  task_id?: number;

  @ApiProperty()
  cost_type?: string;

  @ApiProperty()
  cost_name?: string;

  @ApiProperty({ required: false })
  cost_desc?: string;

  @ApiProperty({ required: false })
  supplier_name?: string;

  @ApiProperty({ required: false })
  quantity?: number;

  @ApiProperty({ required: false })
  measuring_unit?: string;

  @ApiProperty()
  amount?: number;

  @ApiProperty({ required: false })
  bill_to?: string;

  @ApiProperty({ required: false })
  billing_date?: Date;

  @ApiProperty({ required: false })
  charge_type?: string;

  @ApiProperty({ required: false })
  charge_amount?: number;

  @ApiProperty({ required: false })
  total_amount?: number;
}