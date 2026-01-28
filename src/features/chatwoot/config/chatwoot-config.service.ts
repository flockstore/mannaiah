import { Injectable, Logger } from '@nestjs/common'
import { ConfigService as NestConfigService } from '@nestjs/config'
import { ChatwootEnvironmentVariables } from './chatwoot.env'

/**
 * Service to access Chatwoot configuration variables.
 */
@Injectable()
export class ChatwootConfigService extends NestConfigService<ChatwootEnvironmentVariables> {
  private readonly logger = new Logger(ChatwootConfigService.name)

  /**
   * Check if Chatwoot is fully configured
   * @returns true if all required configuration is present
   */
  isConfigured(): boolean {
    const url = this.get('CHATWOOT_URL', { infer: true })
    const accountId = this.get('CHATWOOT_ACCOUNT_ID', { infer: true })
    const apiKey = this.get('CHATWOOT_API_KEY', { infer: true })

    const configured = !!(url && accountId && apiKey)

    if (!configured) {
      this.logger.warn(
        'Chatwoot not configured. Integration disabled. Set CHATWOOT_URL, CHATWOOT_ACCOUNT_ID, and CHATWOOT_API_KEY to enable.',
      )
    }

    return configured
  }

  get url(): string {
    return (
      this.get('CHATWOOT_URL', { infer: true }) || 'https://app.chatwoot.com'
    )
  }

  get apiKey(): string | undefined {
    return this.get('CHATWOOT_API_KEY', { infer: true })
  }

  get accountId(): string | undefined {
    return this.get('CHATWOOT_ACCOUNT_ID', { infer: true })
  }

  get isCronEnabled(): boolean {
    return this.get('CHATWOOT_CONTACTS_CRON', { infer: true }) || false
  }

  get isSyncEnabled(): boolean {
    return this.get('CHATWOOT_CONTACTS_SYNC', { infer: true }) || false
  }
}
