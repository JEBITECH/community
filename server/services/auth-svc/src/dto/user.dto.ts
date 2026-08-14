import { IsString, MinLength, MaxLength, Matches, IsEmail, IsNumber } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MaxLength(50)
  lastName: string;

  @IsEmail()
  email: string;
 
  @IsNumber()
  phone:number;

  @IsString()
  role:string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]+$/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string;

}

export class LoginUserDto {
  @IsEmail()
  email: string;
 
  @IsString()
  password: string;

} 