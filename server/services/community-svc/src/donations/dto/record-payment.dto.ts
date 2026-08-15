import { IsIn, IsOptional } from 'class-validator';

export class RecordPaymentDto {
  @IsIn(['recorded', 'failed'])
  payment_status!: 'recorded' | 'failed';

  @IsOptional()
  @IsIn(['cash', 'upi', 'bank_transfer', 'other'])
  payment_method?: string;
}
