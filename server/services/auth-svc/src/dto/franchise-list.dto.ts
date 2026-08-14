import { IsArray, IsNumber, IsString } from 'class-validator';
import { FranchiseItemDto } from './franchise-item.dto';

export class FranchiseListDto {
  @IsString()
  message?: string;

  @IsArray()
  franchise_list: FranchiseItemDto[];

  @IsNumber()
  total: number;

  @IsNumber()
  page: number;

  @IsNumber()
  limit: number;
}
