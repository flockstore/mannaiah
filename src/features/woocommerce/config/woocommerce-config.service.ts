import { Injectable, Logger } from '@nestjs/common'
import { ConfigService as NestConfigService } from '@nestjs/config'
import { WooCommerceEnvironmentVariables } from './woocommerce.env'

/**
 * Service to access WooCommerce configuration variables.
 * Wraps the NestJS ConfigService to provide typed getters for WooCommerce config.
 */
@Injectable()
export class WooCommerceConfigService extends NestConfigService<WooCommerceEnvironmentVariables> {
  private readonly logger = new Logger(WooCommerceConfigService.name)

  /**
   * Check if WooCommerce is fully configured
   * @returns true if all required configuration is present
   */
  isConfigured(): boolean {
    const url = this.get('WOOCOMMERCE_URL', { infer: true })
    const consumerKey = this.get('WOOCOMMERCE_CONSUMER_KEY', { infer: true })
    const consumerSecret = this.get('WOOCOMMERCE_CONSUMER_SECRET', {
      infer: true,
    })

    const configured = !!(url && consumerKey && consumerSecret)

    if (!configured) {
      this.logger.warn(
        'WooCommerce not configured. Customer sync is disabled. Set WOOCOMMERCE_URL, WOOCOMMERCE_CONSUMER_KEY, and WOOCOMMERCE_CONSUMER_SECRET to enable.',
      )
    }

    return configured
  }

  /**
   * Check if contact sync is enabled
   * @returns true if sync is enabled and configured
   */
  isSyncContactsEnabled(): boolean {
    const syncEnabled = this.get('WOOCOMMERCE_SYNC_CONTACTS', { infer: true })
    return !!syncEnabled && this.isConfigured()
  }

  /**
   * Gets the WooCommerce store URL
   * @returns The store URL or undefined if not configured
   */
  get url(): string | undefined {
    return this.get('WOOCOMMERCE_URL', { infer: true })
  }

  /**
   * Gets the WooCommerce consumer key
   * @returns The consumer key or undefined if not configured
   */
  get consumerKey(): string | undefined {
    return this.get('WOOCOMMERCE_CONSUMER_KEY', { infer: true })
  }

  /**
   * Gets the WooCommerce consumer secret
   * @returns The consumer secret or undefined if not configured
   */
  get consumerSecret(): string | undefined {
    return this.get('WOOCOMMERCE_CONSUMER_SECRET', { infer: true })
  }

  /**
   * Gets the cron schedule for customer sync
   * @returns The cron expression, defaults to "0 0 * * *" (daily at midnight)
   */
  get syncCronSchedule(): string {
    return this.get('WOOCOMMERCE_SYNC_CRON', { infer: true }) || '0 0 * * *'
  }
}
