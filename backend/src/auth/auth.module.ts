import { Global, Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { AdminGuard } from './admin.guard'
import { AuthController } from './auth.controller'
import { authConfig } from './auth.config'

@Global()
@Module({
  imports: [JwtModule.register({ secret: authConfig.jwtSecret })],
  controllers: [AuthController],
  providers: [{ provide: APP_GUARD, useClass: AdminGuard }],
  exports: [JwtModule],
})
export class AuthModule {}
