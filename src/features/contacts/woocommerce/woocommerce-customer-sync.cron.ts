import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { WooCommerceConfigService } from '../../woocommerce/config/woocommerce-config.service'
import { WooCommerceApiService } from '../../woocommerce/services/woocommerce-api.service'
import { WooCommerceSyncService } from './woocommerce-sync.service'
import { firstValueFrom } from 'rxjs'

/**
 * Cron job for syncing WooCommerce customers to contacts
 */
@Injectable()
export class WooCommerceCustomerSyncCron {
  private readonly logger = new Logger(WooCommerceCustomerSyncCron.name)
  private isRunning = false

  constructor(
    private readonly config: WooCommerceConfigService,
    private readonly wooCommerceApi: WooCommerceApiService,
    private readonly syncService: WooCommerceSyncService,
  ) {
    this.logCronStatus()
  }

  /**
   * Log the cron job status on initialization
   */
  private logCronStatus(): void {
    if (this.config.isSyncContactsEnabled()) {
      this.logger.log(
        `WooCommerce customer sync cron enabled with schedule: ${this.config.syncCronSchedule}`,
      )
    } else {
      this.logger.warn(
        'WooCommerce customer sync cron disabled (not configured or WOOCOMMERCE_SYNC_CONTACTS=false)',
      )
    }
  }

  /**
   * Execute the customer sync
   * This method can be called both by cron and manually
   */
  async executeSync(): Promise<void> {
    // Prevent concurrent executions
    if (this.isRunning) {
      this.logger.warn('Sync already running, skipping this execution')
      return
    }

    // Check if sync is enabled
    if (!this.config.isSyncContactsEnabled()) {
      this.logger.debug('Sync is disabled, skipping execution')
      return
    }

    this.isRunning = true
    this.logger.log('Starting customer sync...')

    try {
      // Validate connection first
      const connectionValid = await firstValueFrom(
        this.wooCommerceApi.validateConnection(),
      )

      if (!connectionValid) {
        this.logger.error(
          'WooCommerce connection validation failed, aborting sync',
        )
        return
      }

      // Execute the sync
      const stats = await firstValueFrom(this.syncService.syncCustomers())

      // Log results
      this.logger.log(
        `Sync completed - Total: ${stats.total}, Created: ${stats.created}, Updated: ${stats.updated}, Unchanged: ${stats.unchanged}, Errors: ${stats.errors}`,
      )

      if (stats.errors > 0 && stats.errorDetails.length > 0) {
        // Only log first few error details to avoid overwhelming logs
        const maxErrors = 5
        const errorsToLog = stats.errorDetails.slice(0, maxErrors)
        this.logger.warn(
          `Errors encountered during sync (showing ${errorsToLog.length} of ${stats.errorDetails.length}):`,
        )
        errorsToLog.forEach((error) => this.logger.warn(`  - ${error}`))
      }
    } catch (error) {
      // Fatal error - log full trace
      this.logger.error(
        'Fatal error during customer sync',
        error instanceof Error ? error.stack : String(error),
      )
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Scheduled cron job for customer sync
   * Uses configurable schedule from environment variable
   */
  @Cron('0 0 * * *', {
    name: 'woocommerce-customer-sync',
  })
  async handleCron(): Promise<void> {
    await this.executeSync()
  }
}
