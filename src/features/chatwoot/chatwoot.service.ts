import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ChatwootConfigService } from './config/chatwoot-config.service'
import { ContactDocument } from '../contacts/interfaces/contact.interface'
import { ChatwootMapper, ChatwootContactPayload } from './utils/chatwoot.mapper'
import { lastValueFrom } from 'rxjs'

@Injectable()
export class ChatwootService implements OnModuleInit {
  private readonly logger = new Logger(ChatwootService.name)
  private isEnabled = false

  constructor(
    private readonly configService: ChatwootConfigService,
    private readonly httpService: HttpService,
  ) { }

  async onModuleInit() {
    if (!this.configService.isConfigured()) {
      return
    }

    this.isEnabled = true

    if (this.configService.isSyncEnabled) {
      await this.verifyCredentials()
    }
  }

  /**
   * Verified if the provided credentials are valid by querying the account details.
   */
  async verifyCredentials(): Promise<boolean> {
    try {
      const url = `${this.configService.url}/api/v1/accounts/${this.configService.accountId}/contacts?limit=1`
      await this.executeWithRetry(() =>
        lastValueFrom(
          this.httpService.get(url, {
            headers: {
              api_access_token: this.configService.apiKey,
            },
          }),
        ),
      )
      this.logger.log('Chatwoot credentials verified successfully.')
      return true
    } catch (error) {
      this.logger.error(
        'Invalid Chatwoot credentials. Integration disabled.',
        (error as Error).message,
      )
      this.isEnabled = false
      return false
    }
  }

  /**
   * Syncs a single contact to Chatwoot.
   */
  async syncContact(contact: ContactDocument): Promise<void> {
    if (!this.isEnabled) return

    try {
      const payload = ChatwootMapper.toChatwootPayload(contact)
      // This will now throw if search fails (e.g. 429 after retries), preventing false "not found" -> "create" loop
      const existingContactId = await this.findContactIdByEmail(contact.email)

      if (existingContactId) {
        await this.updateContact(existingContactId, payload)
      } else {
        await this.createContact(payload)
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync contact ${this.maskEmail(contact.email)}: ${this.formatError(error)}`,
      )
    }
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@')
    if (!local || !domain) return email
    const maskedLocal = local.length > 2 ? `${local.slice(0, 2)}***` : '***'
    return `${maskedLocal}@${domain}`
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private formatError(error: any): string {
    if (error.response?.data) {
      return `${error.message} - Details: ${JSON.stringify(error.response.data)}`
    }
    return error.message
  }

  private async findContactIdByEmail(email: string): Promise<number | null> {
    const url = `${this.configService.url}/api/v1/accounts/${this.configService.accountId}/contacts/search?q=${email}`

    // We do NOT support silent failure here for connection errors. 
    // If connection fails, it should throw so syncContact aborts.
    // We only return null if the response is valid but empty.
    return this.executeWithRetry(async () => {
      const res = await lastValueFrom(
        this.httpService.get<{ payload: { id: number }[] }>(url, {
          headers: { api_access_token: this.configService.apiKey },
        }),
      )

      if (res.data?.payload?.length > 0) {
        return res.data.payload[0].id
      }
      return null
    })
  }

  private async createContact(payload: ChatwootContactPayload): Promise<void> {
    const url = `${this.configService.url}/api/v1/accounts/${this.configService.accountId}/contacts`
    await this.executeWithRetry(() =>
      lastValueFrom(
        this.httpService.post(url, payload, {
          headers: { api_access_token: this.configService.apiKey },
        }),
      ),
    )
  }

  private async updateContact(
    contactId: number,
    payload: ChatwootContactPayload,
  ): Promise<void> {
    const url = `${this.configService.url}/api/v1/accounts/${this.configService.accountId}/contacts/${contactId}`
    await this.executeWithRetry(() =>
      lastValueFrom(
        this.httpService.put(url, payload, {
          headers: { api_access_token: this.configService.apiKey },
        }),
      ),
    )
  }

  /**
   * Executes a function with retry logic for 429 Too Many Requests.
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries = 3,
    delayMs = 1000,
  ): Promise<T> {
    try {
      return await operation()
    } catch (error: any) {
      if (retries > 0 && error.response?.status === 429) {
        this.logger.warn(
          `Rate limit hit (429). Retrying in ${delayMs}ms. Retries left: ${retries}`,
        )
        await this.sleep(delayMs)
        // Exponential backoff
        return this.executeWithRetry(operation, retries - 1, delayMs * 2)
      }
      throw error
    }
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
