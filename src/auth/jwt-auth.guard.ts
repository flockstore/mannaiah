import { ExecutionContext, Injectable, Logger } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ConfigService } from '../core/config/config.service'
import { Environment } from '../core/config/core.env'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name)

  constructor(private readonly configService: ConfigService) {
    super()
  }

  canActivate(context: ExecutionContext) {
    // Development Bypass Check
    if (this.configService.nodeEnv === Environment.Development) {
      const devToken = this.configService.devAuthToken
      const request = context.switchToHttp().getRequest()
      const authHeader = request.headers.authorization

      if (devToken && authHeader === `Bearer ${devToken}`) {
        this.logger.debug('Using Dev Auth Token Bypass')
        // We need to attach a minimal user object to the request so controllers don't crash
        // if they try to access request.user
        request.user = {
          sub: 'dev-admin',
          roles: ['admin'], // Grant admin assumption or similar for dev
        }
        return true
      }
    }

    return super.canActivate(context)
  }
}
