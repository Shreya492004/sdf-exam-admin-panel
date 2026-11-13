import { randomBytes } from 'node:crypto'

/** Settings read from environment variables (see backend/.env.example). */
export const authConfig = {
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  /** No built-in password: admin sign-in stays off until ADMIN_PASSWORD is set in .env. */
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
  /** Without JWT_SECRET a random one is used, so tokens stop working when the server restarts. */
  jwtSecret: process.env.JWT_SECRET || randomBytes(32).toString('hex'),
  adminTokenTtl: process.env.ADMIN_TOKEN_TTL ?? '12h',
  /** Token lifetime when "Remember me" is ticked. */
  adminRememberTtl: process.env.ADMIN_REMEMBER_TTL ?? '30d',
}

export type AdminTokenPayload = { sub: 'admin'; role: 'admin' }
export type StudentTokenPayload = { sub: string; role: 'student'; examId: string }
