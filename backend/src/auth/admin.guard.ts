import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import type { Request } from 'express'
import { IS_PUBLIC } from './public.decorator'
import type { AdminTokenPayload } from './auth.config'

export const bearerToken = (req: Request) => {
  const [type, token] = (req.headers.authorization ?? '').split(' ')
  return type === 'Bearer' && token ? token : undefined
}

/** Every route needs an admin token unless it is marked @Public(). */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])
    if (isPublic) return true

    const token = bearerToken(context.switchToHttp().getRequest<Request>())
    if (!token) throw new UnauthorizedException('Please sign in.')
    try {
      const payload = await this.jwt.verifyAsync<AdminTokenPayload>(token)
      if (payload.role !== 'admin') throw new Error('not admin')
      return true
    } catch {
      throw new UnauthorizedException('Your session has expired. Please sign in again.')
    }
  }
}
