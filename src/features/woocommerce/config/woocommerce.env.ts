import { IsOptional, IsString, IsBoolean } from 'class-validator'
import { Transform } from 'class-transformer'

/**
 * Environment variables for WooCommerce integration.
 * All fields are optional to allow the application to start without WooCommerce configured.
 */
export class WooCommerceEnvironmentVariables {
  /**
   * WooCommerce store URL
   * @example https://yourstore.com
   */
  @IsOptional()
  @IsString()
  WOOCOMMERCE_URL?: string

  /**
   * WooCommerce REST API consumer key
   */
  @IsOptional()
  @IsString()
  WOOCOMMERCE_CONSUMER_KEY?: string

  /**
   * WooCommerce REST API consumer secret
   */
  @IsOptional()
  @IsString()
  WOOCOMMERCE_CONSUMER_SECRET?: string

  /**
   * Enable/disable customer sync from WooCommerce
   * @default false
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  WOOCOMMERCE_SYNC_CONTACTS?: boolean = false

  /**
   * Cron schedule expression for customer sync
  */
  @IsOptional()
  @IsString()
  WOOCOMMERCE_SYNC_CRON?: string = '0 0 * * *'
}
