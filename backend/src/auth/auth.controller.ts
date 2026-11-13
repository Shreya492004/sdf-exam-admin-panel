import { Body, Controller, Get, HttpCode, Post, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { timingSafeEqual } from 'crypto'
import { authConfig, type AdminTokenPayload } from './auth.config'
import { LoginDto } from './auth.dto'
import { Public } from './public.decorator'

const same = (a: string, b: string) => {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

@Controller('auth')
export class AuthController {
  constructor(private readonly jwt: JwtService) {}

  /** Admin sign-in. Returns a bearer token for the admin API. */
  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: LoginDto) {
    if (!authConfig.adminPassword) {
      throw new ServiceUnavailableException('Admin sign-in is not set up yet. Set ADMIN_PASSWORD in backend/.env.')
    }
    if (!same(body.username.trim(), authConfig.adminUsername) || !same(body.password, authConfig.adminPassword)) {
      throw new UnauthorizedException('Incorrect username or password.')
    }
    const payload: AdminTokenPayload = { sub: 'admin', role: 'admin' }
    const token = await this.jwt.signAsync(payload, {
      expiresIn: (body.remember ? authConfig.adminRememberTtl : authConfig.adminTokenTtl) as never,
    })
    return { token, username: authConfig.adminUsername }
  }

  /** Checks that the current admin token is still valid. */
  @Get('me')
  me() {
    return { username: authConfig.adminUsername }
  }
}
