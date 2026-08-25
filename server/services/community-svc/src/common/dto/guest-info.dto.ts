import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class GuestInfoDto {
  @IsString()
  first_name!: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @Matches(/^[0-9]{7,15}$/, { message: 'phone must be a valid phone number (7-15 digits)' })
  phone!: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
