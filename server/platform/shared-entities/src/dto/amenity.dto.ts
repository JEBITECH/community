import { IsOptional, IsString } from "class-validator";

export class AmenityDto {
    @IsString()
    @IsOptional()
    label?: string;
    @IsString()
    @IsOptional()
    value?: string;
}