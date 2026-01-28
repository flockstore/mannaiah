import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ChatwootConfigService } from '../config/chatwoot-config.service'
import { ChatwootService } from '../chatwoot.service'
import { ContactService } from '../../contacts/services/contact.service'
import { ContactDocument } from '../../contacts/interfaces/contact.interface'
import pLimit from 'p-limit'
import { lastValueFrom } from 'rxjs'

@Injectable()
export class ChatwootContactsCron {
  private readonly logger = new Logger(ChatwootContactsCron.name)
  private isRunning = false

  constructor(
    private readonly configService: ChatwootConfigService,
    private readonly chatwootService: ChatwootService,
    private readonly contactService: ContactService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Default schedule, can be adjusted
  async handleCron() {
    if (!this.configService.isCronEnabled) {
      return
    }

    if (this.isRunning) {
      this.logger.warn('Chatwoot sync cron is already running. Skipping.')
      return
    }

    this.logger.log('Starting Chatwoot contact sync cron job...')
    this.isRunning = true

    try {
      await this.syncAll()
      this.logger.log('Chatwoot contact sync cron job completed.')
    } catch (error) {
      this.logger.error('Chatwoot contact sync cron job failed', error)
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Syncs all contacts with pagination.
   */
  async syncAll() {
    const limit = 100
    let page = 1
    let totalSynced = 0
    let hasMore = true

    // Concurrency limit for Chatwoot API calls to avoid rate limiting
    const limitConcurrency = pLimit(10)

    while (hasMore) {
      const resultObservable = this.contactService.findAllPaginated(
        {},
        page,
        limit,
        { withDeleted: false },
      )

      const result = await lastValueFrom(resultObservable)

      // result.data contains the array of items in BaseService.findAllPaginated
      const contacts: ContactDocument[] = result.data

      if (!contacts || contacts.length === 0) {
        hasMore = false
        break
      }

      const tasks = contacts.map((contact) =>
        limitConcurrency(() => this.chatwootService.syncContact(contact)),
      )

      await Promise.all(tasks)

      totalSynced += contacts.length
      const totalPages = Math.ceil(result.total / limit)

      this.logger.log(
        `Synced batch ${page}/${totalPages} (${totalSynced} contacts so far)`,
      )

      if (page >= totalPages) {
        hasMore = false
      } else {
        page++
      }
    }
  }

  /**
   * Syncs a specific list of contacts by email.
   * Useful for manual triggers.
   */
  async syncByEmails(emails: string[]) {
    this.logger.log(`Starting manual sync for ${emails.length} emails...`)
    const limitConcurrency = pLimit(10)

    const tasks = emails.map((email) =>
      limitConcurrency(async () => {
        try {
          // Using findOne from BaseService which returns Observable
          const contactObservable = this.contactService.findOne({ email })
          const contact = await lastValueFrom(contactObservable)

          if (contact) {
            await this.chatwootService.syncContact(contact)
          } else {
            this.logger.warn(`Contact not found for email: ${email}`)
          }
        } catch (e) {
          this.logger.error(
            `Error syncing email ${email}: ${(e as Error).message}`,
          )
        }
      }),
    )

    await Promise.all(tasks)
    this.logger.log(`Manual sync completed for ${emails.length} emails.`)
  }
}
