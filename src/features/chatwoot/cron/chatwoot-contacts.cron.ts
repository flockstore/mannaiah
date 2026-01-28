import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { ChatwootConfigService } from '../config/chatwoot-config.service'
import { ChatwootService } from '../chatwoot.service'
import { ContactService } from '../../contacts/services/contact.service'
import { ContactDocument } from '../../contacts/interfaces/contact.interface'
import pLimit from 'p-limit'
import { lastValueFrom } from 'rxjs'

@Injectable()
export class ChatwootContactsCron implements OnModuleInit {
  private readonly logger = new Logger(ChatwootContactsCron.name)
  private isRunning = false

  constructor(
    private readonly configService: ChatwootConfigService,
    private readonly chatwootService: ChatwootService,
    private readonly contactService: ContactService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    if (!this.configService.isSyncEnabled) {
      this.logger.log('Chatwoot sync is disabled. Skipping cron scheduling.')
      return
    }

    const schedule = this.configService.cronSchedule
    this.logger.log(`Scheduling Chatwoot sync cron with schedule: ${schedule}`)

    const job = new CronJob(schedule, () => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.handleCron()
    })

    this.schedulerRegistry.addCronJob('chatwoot_contacts_sync', job)
    job.start()
  }

  async handleCron() {
    // Double check enablement in case it changed at runtime (unlikely for envs but good practice)
    if (!this.configService.isSyncEnabled) {
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
