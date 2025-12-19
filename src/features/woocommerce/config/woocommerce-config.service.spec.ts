import { Test, TestingModule } from '@nestjs/testing'
import { WooCommerceConfigService } from './woocommerce-config.service'
import { ConfigModule } from '@nestjs/config'

describe('WooCommerceConfigService', () => {
  let service: WooCommerceConfigService

  describe('with full configuration', () => {
    beforeEach(async () => {
      process.env.WOOCOMMERCE_URL = 'https://test-store.com'
      process.env.WOOCOMMERCE_CONSUMER_KEY = 'ck_test123'
      process.env.WOOCOMMERCE_CONSUMER_SECRET = 'cs_test456'
      process.env.WOOCOMMERCE_SYNC_CONTACTS = 'true'
      process.env.WOOCOMMERCE_SYNC_CRON = '0 0 * * *'

      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            // Bypassing validation in tests due to environment issues
            validate: (config) => config,
            ignoreEnvFile: true,
          }),
        ],
        providers: [WooCommerceConfigService],
      }).compile()

      service = module.get<WooCommerceConfigService>(WooCommerceConfigService)
    })

    afterEach(() => {
      delete process.env.WOOCOMMERCE_URL
      delete process.env.WOOCOMMERCE_CONSUMER_KEY
      delete process.env.WOOCOMMERCE_CONSUMER_SECRET
      delete process.env.WOOCOMMERCE_SYNC_CONTACTS
      delete process.env.WOOCOMMERCE_SYNC_CRON
    })

    it('should be defined', () => {
      expect(service).toBeDefined()
    })

    it('should return true for isConfigured when all vars are set', () => {
      expect(service.isConfigured()).toBe(true)
    })

    it('should return true for isSyncContactsEnabled when enabled', () => {
      expect(service.isSyncContactsEnabled()).toBe(true)
    })

    it('should return the correct URL', () => {
      expect(service.url).toBe('https://test-store.com')
    })

    it('should return the correct consumer key', () => {
      expect(service.consumerKey).toBe('ck_test123')
    })

    it('should return the correct consumer secret', () => {
      expect(service.consumerSecret).toBe('cs_test456')
    })

    it('should return the correct cron schedule', () => {
      expect(service.syncCronSchedule).toBe('0 0 * * *')
    })
  })

  describe('with partial configuration', () => {
    beforeEach(async () => {
      process.env.WOOCOMMERCE_URL = 'https://test-store.com'
      // Missing consumer key and secret

      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            validate: (config) => config,
            ignoreEnvFile: true,
          }),
        ],
        providers: [WooCommerceConfigService],
      }).compile()

      service = module.get<WooCommerceConfigService>(WooCommerceConfigService)
    })

    afterEach(() => {
      delete process.env.WOOCOMMERCE_URL
    })

    it('should return false for isConfigured when vars are missing', () => {
      expect(service.isConfigured()).toBe(false)
    })

    it('should return false for isSyncContactsEnabled when not configured', () => {
      expect(service.isSyncContactsEnabled()).toBe(false)
    })
  })

  describe('with no configuration', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            validate: (config) => config,
            ignoreEnvFile: true,
          }),
        ],
        providers: [WooCommerceConfigService],
      }).compile()

      service = module.get<WooCommerceConfigService>(WooCommerceConfigService)
    })

    it('should return false for isConfigured', () => {
      expect(service.isConfigured()).toBe(false)
    })

    it('should return undefined for configuration values', () => {
      expect(service.url).toBeUndefined()
      expect(service.consumerKey).toBeUndefined()
      expect(service.consumerSecret).toBeUndefined()
    })

    it('should return default cron schedule', () => {
      expect(service.syncCronSchedule).toBe('0 0 * * *')
    })
  })
})
