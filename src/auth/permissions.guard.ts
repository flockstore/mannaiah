/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from './permissions.decorator'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiredPermissions) {
      return true
    }

    const { user } = context.switchToHttp().getRequest()
    if (!user || typeof user !== 'object' || !('scope' in user)) {
      return false
    }

    const userScopes = (user.scope as string).split(' ')

    return requiredPermissions.every((permission) => {
      if (userScopes.includes(permission)) {
        return true
      }
      const [resource] = permission.split(':')
      if (resource && userScopes.includes(`${resource}:manage`)) {
        return true
      }
      return false
    })
  }
}
