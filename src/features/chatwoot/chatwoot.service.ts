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
      // Use a standard account API to verify credentials (e.g., list contacts with limit 1)
      const url = `${this.configService.url}/api/v1/accounts/${this.configService.accountId}/contacts?limit=1`
      await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            api_access_token: this.configService.apiKey,
          },
        }),
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
   * Strategies:
   * 1. Search by email.
   * 2. If found, update.
   * 3. If not found, create.
   */
  async syncContact(contact: ContactDocument): Promise<void> {
    if (!this.isEnabled) return

    try {
      const payload = ChatwootMapper.toChatwootPayload(contact)
      const existingContactId = await this.findContactIdByEmail(contact.email)

      if (existingContactId) {
        await this.updateContact(existingContactId, payload)
      } else {
        await this.createContact(payload)
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync contact ${contact.email}: ${(error as Error).message}`,
      )
    }
  }

  private async findContactIdByEmail(email: string): Promise<number | null> {
    const url = `${this.configService.url}/api/v1/accounts/${this.configService.accountId}/contacts/search?q=${email}`
    try {
      const res = await lastValueFrom(
        this.httpService.get<{ payload: { id: number }[] }>(url, {
          headers: { api_access_token: this.configService.apiKey },
        }),
      )

      if (res.data?.payload?.length > 0) {
        return res.data.payload[0].id
      }
      return null
    } catch (error) {
      this.logger.warn(
        `Error searching contact ${email}: ${(error as Error).message}`,
      )
      return null
    }
  }

  private async createContact(payload: ChatwootContactPayload): Promise<void> {
    const url = `${this.configService.url}/api/v1/accounts/${this.configService.accountId}/contacts`
    await lastValueFrom(
      this.httpService.post(url, payload, {
        headers: { api_access_token: this.configService.apiKey },
      }),
    )
  }

  private async updateContact(
    contactId: number,
    payload: ChatwootContactPayload,
  ): Promise<void> {
    const url = `${this.configService.url}/api/v1/accounts/${this.configService.accountId}/contacts/${contactId}`
    await lastValueFrom(
      this.httpService.put(url, payload, {
        headers: { api_access_token: this.configService.apiKey },
      }),
    )
  }
}
