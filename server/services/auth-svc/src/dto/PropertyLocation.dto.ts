import { IsString } from "class-validator";

export class PropertyLocationDto {
  @IsString()
  property_name: string;

  @IsString()
  property_location: string;
}