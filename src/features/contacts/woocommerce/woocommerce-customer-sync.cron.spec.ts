import { Test, TestingModule } from '@nestjs/testing'
import { WooCommerceCustomerSyncCron } from './woocommerce-customer-sync.cron'
import { WooCommerceConfigService } from '../../woocommerce/config/woocommerce-config.service'
import { WooCommerceApiService } from '../../woocommerce/services/woocommerce-api.service'
import { WooCommerceSyncService } from './woocommerce-sync.service'
import { of } from 'rxjs'

describe('WooCommerceCustomerSyncCron', () => {
    let cron: WooCommerceCustomerSyncCron
    let configService: jest.Mocked<WooCommerceConfigService>
    let wooCommerceApi: jest.Mocked<WooCommerceApiService>
    let syncService: jest.Mocked<WooCommerceSyncService>

    beforeEach(async () => {
        const mockConfigService = {
            isSyncContactsEnabled: jest.fn(),
            syncCronSchedule: '0 0 * * *',
        }

        const mockWooCommerceApi = {
            validateConnection: jest.fn(),
        }

        const mockSyncService = {
            syncCustomers: jest.fn(),
        }

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WooCommerceCustomerSyncCron,
                {
                    provide: WooCommerceConfigService,
                    useValue: mockConfigService,
                },
                {
                    provide: WooCommerceApiService,
                    useValue: mockWooCommerceApi,
                },
                {
                    provide: WooCommerceSyncService,
                    useValue: mockSyncService,
                },
            ],
        }).compile()

        cron = module.get<WooCommerceCustomerSyncCron>(
            WooCommerceCustomerSyncCron,
        )
        configService = module.get(WooCommerceConfigService)
        wooCommerceApi = module.get(WooCommerceApiService)
        syncService = module.get(WooCommerceSyncService)
    })

    it('should be defined', () => {
        expect(cron).toBeDefined()
    })

    describe('when sync is not enabled', () => {
        beforeEach(() => {
            configService.isSyncContactsEnabled.mockReturnValue(false)
        })

        it('should not execute sync', async () => {
            await cron.executeSync()

            expect(syncService.syncCustomers).not.toHaveBeenCalled()
        })
    })

    describe('when sync is enabled', () => {
        beforeEach(() => {
            configService.isSyncContactsEnabled.mockReturnValue(true)
        })

        it('should validate connection before sync', async () => {
            wooCommerceApi.validateConnection.mockReturnValue(of(true))
            syncService.syncCustomers.mockReturnValue(
                of({
                    total: 0,
                    created: 0,
                    updated: 0,
                    unchanged: 0,
                    errors: 0,
                    errorDetails: [],
                }),
            )

            await cron.executeSync()

            expect(wooCommerceApi.validateConnection).toHaveBeenCalled()
        })

        it('should abort sync if connection validation fails', async () => {
            wooCommerceApi.validateConnection.mockReturnValue(of(false))

            await cron.executeSync()

            expect(syncService.syncCustomers).not.toHaveBeenCalled()
        })

        it('should execute sync when connection is valid', async () => {
            wooCommerceApi.validateConnection.mockReturnValue(of(true))
            syncService.syncCustomers.mockReturnValue(
                of({
                    total: 5,
                    created: 2,
                    updated: 2,
                    unchanged: 1,
                    errors: 0,
                    errorDetails: [],
                }),
            )

            await cron.executeSync()

            expect(syncService.syncCustomers).toHaveBeenCalled()
        })

        it('should handle sync errors gracefully', async () => {
            wooCommerceApi.validateConnection.mockReturnValue(of(true))
            syncService.syncCustomers.mockReturnValue(
                of({
                    total: 5,
                    created: 2,
                    updated: 0,
                    unchanged: 0,
                    errors: 3,
                    errorDetails: ['Error 1', 'Error 2', 'Error 3'],
                }),
            )

            await cron.executeSync()

            // Should complete without throwing
            expect(syncService.syncCustomers).toHaveBeenCalled()
        })

        it('should prevent concurrent executions', async () => {
            wooCommerceApi.validateConnection.mockReturnValue(of(true))
            syncService.syncCustomers.mockReturnValue(
                of({
                    total: 0,
                    created: 0,
                    updated: 0,
                    unchanged: 0,
                    errors: 0,
                    errorDetails: [],
                }),
            )

            // Start two syncs simultaneously
            const promise1 = cron.executeSync()
            const promise2 = cron.executeSync()

            await Promise.all([promise1, promise2])

            // Should only execute once
            expect(syncService.syncCustomers).toHaveBeenCalledTimes(1)
        })

        it('should handle fatal errors', async () => {
            wooCommerceApi.validateConnection.mockImplementation(() => {
                throw new Error('Fatal connection error')
            })

            // Should not throw
            await expect(cron.executeSync()).resolves.not.toThrow()
        })
    })

    describe('handleCron', () => {
        it('should call executeSync', async () => {
            configService.isSyncContactsEnabled.mockReturnValue(false)

            const executeSyncSpy = jest.spyOn(cron, 'executeSync')

            await cron.handleCron()

            expect(executeSyncSpy).toHaveBeenCalled()
        })
    })
})
