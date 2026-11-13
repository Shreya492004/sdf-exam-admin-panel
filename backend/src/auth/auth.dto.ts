import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  username: string

  @IsString()
  @IsNotEmpty()
  password: string

  /** "Remember me": issue a longer-lived token. */
  @IsOptional()
  @IsBoolean()
  remember?: boolean
}
