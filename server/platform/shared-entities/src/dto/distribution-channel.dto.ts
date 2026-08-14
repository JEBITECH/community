import { IsString, IsNotEmpty } from "class-validator";

export class DistributionChannelDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}