import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC = 'isPublic'

/** Marks a route as open to everyone (no admin token needed). */
export const Public = () => SetMetadata(IS_PUBLIC, true)
