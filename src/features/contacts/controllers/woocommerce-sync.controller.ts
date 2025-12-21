import { Controller, Post, HttpCode, HttpStatus, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { WooCommerceCustomerSyncCron } from '../woocommerce/woocommerce-customer-sync.cron'

/**
 * Controller for WooCommerce sync operations
 */
@ApiTags('woocommerce')
@Controller('woocommerce')
export class WooCommerceSyncController {
  private readonly logger = new Logger(WooCommerceSyncController.name)

  constructor(private readonly syncCron: WooCommerceCustomerSyncCron) {}

  /**
   * Manually trigger WooCommerce customer sync
   * Triggers the sync asynchronously and returns immediately
   *
   * @returns 200 if sync was triggered successfully
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger WooCommerce customer sync',
    description:
      'Manually triggers a sync of customers from WooCommerce orders. The sync runs asynchronously and this endpoint returns immediately after triggering.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sync triggered successfully',
  })
  triggerSync() {
    this.logger.log('Manual sync triggered via API')

    this.syncCron.executeSync().catch((error) => {
      this.logger.error(
        'Error in manual sync execution',
        error instanceof Error ? error.stack : String(error),
      )
    })
  }
}
