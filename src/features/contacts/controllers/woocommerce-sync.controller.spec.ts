/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing'
import { WooCommerceSyncController } from './woocommerce-sync.controller'
import { WooCommerceCustomerSyncCron } from '../woocommerce/woocommerce-customer-sync.cron'

describe('WooCommerceSyncController', () => {
  let controller: WooCommerceSyncController
  let syncCron: jest.Mocked<WooCommerceCustomerSyncCron>

  beforeEach(async () => {
    const mockSyncCron = {
      executeSync: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WooCommerceSyncController],
      providers: [
        {
          provide: WooCommerceCustomerSyncCron,
          useValue: mockSyncCron,
        },
      ],
    }).compile()

    controller = module.get<WooCommerceSyncController>(
      WooCommerceSyncController,
    )
    syncCron = module.get(WooCommerceCustomerSyncCron)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('triggerSync', () => {
    it('should trigger sync and return immediately', () => {
      syncCron.executeSync.mockResolvedValue(undefined)

      const result = controller.triggerSync()

      expect(result).toBeUndefined()
      expect(syncCron.executeSync).toHaveBeenCalled()
    })

    it('should not wait for sync completion', () => {
      // Create a promise that resolves after a delay
      let resolveSync: () => void
      const syncPromise = new Promise<void>((resolve) => {
        resolveSync = resolve
      })
      syncCron.executeSync.mockReturnValue(syncPromise)

      // Call triggerSync
      const result = controller.triggerSync()

      // Should return immediately even though sync hasn't completed
      expect(result).toBeUndefined()
      expect(syncCron.executeSync).toHaveBeenCalled()

      // Clean up
      resolveSync!()
    })

    it('should handle sync errors gracefully', () => {
      syncCron.executeSync.mockRejectedValue(new Error('Sync failed'))

      // Should not throw
      expect(() => controller.triggerSync()).not.toThrow()
    })
  })
})
