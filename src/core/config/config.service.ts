import { Injectable } from '@nestjs/common'
import { ConfigService as NestConfigService } from '@nestjs/config'
import { CoreEnvironmentVariables } from './core.env'

/**
 * Service to access configuration variables.
 * Wraps the NestJS ConfigService to provide typed getters.
 */
@Injectable()
export class ConfigService extends NestConfigService<CoreEnvironmentVariables> {
  /**
   * Gets the port the application should listen on.
   * @returns The port number.
   * @throws Error if MANNAIAH_PORT is not defined.
   */
  get port(): number {
    const port = this.get('MANNAIAH_PORT', { infer: true })
    if (port === undefined) {
      throw new Error('MANNAIAH_PORT is not defined')
    }
    return port
  }

  /**
   * Gets the current Node environment.
   * @returns The environment string (e.g., 'development', 'production').
   * @throws Error if NODE_ENV is not defined.
   */
  get nodeEnv(): string {
    const nodeEnv = this.get('NODE_ENV', { infer: true })
    if (nodeEnv === undefined) {
      throw new Error('NODE_ENV is not defined')
    }
    return nodeEnv
  }

  /**
   * Gets the Logto Issuer URL.
   * @returns The issuer URL.
   * @throws Error if LOGTO_ISSUER is not defined.
   */
  get logtoIssuer(): string {
    const issuer = this.get('LOGTO_ISSUER', { infer: true })
    if (issuer === undefined) {
      throw new Error('LOGTO_ISSUER is not defined')
    }
    return issuer
  }

  /**
   * Gets the Logto Audience.
   * @returns The audience string.
   * @throws Error if LOGTO_AUDIENCE is not defined.
   */
  get logtoAudience(): string {
    const audience = this.get('LOGTO_AUDIENCE', { infer: true })
    if (audience === undefined) {
      throw new Error('LOGTO_AUDIENCE is not defined')
    }
    return audience
  }
}
