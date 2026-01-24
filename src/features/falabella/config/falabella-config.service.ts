import { Injectable, Logger } from '@nestjs/common'
import { ConfigService as NestConfigService } from '@nestjs/config'
import { FalabellaEnvironmentVariables } from './falabella.env'

/**
 * Service to access Falabella configuration variables.
 */
@Injectable()
export class FalabellaConfigService extends NestConfigService<FalabellaEnvironmentVariables> {
  private readonly logger = new Logger(FalabellaConfigService.name)

  /**
   * Check if Falabella is fully configured
   * @returns true if all required configuration is present
   */
  isConfigured(): boolean {
    const userId = this.get('FALABELLA_USER_ID', { infer: true })
    const apiKey = this.get('FALABELLA_API_KEY', { infer: true })

    const configured = !!(userId && apiKey)

    if (!configured) {
      this.logger.warn(
        'Falabella not configured. Integration disabled. Set FALABELLA_USER_ID and FALABELLA_API_KEY to enable.',
      )
    }

    return configured
  }

  /**
   * Gets the Falabella User ID.
   * @returns The user ID or undefined.
   */
  get userId(): string | undefined {
    return this.get('FALABELLA_USER_ID', { infer: true })
  }

  /**
   * Gets the Falabella API Key.
   * @returns The API key or undefined.
   */
  get apiKey(): string | undefined {
    return this.get('FALABELLA_API_KEY', { infer: true })
  }
  /**
   * Gets the Falabella User Agent.
   * @returns The User Agent or undefined.
   */
  get userAgent(): string | undefined {
    return this.get('FALABELLA_USER_AGENT', { infer: true })
  }
}
