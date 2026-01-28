/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing'
import { ChatwootContactsCron } from './chatwoot-contacts.cron'
import { ChatwootService } from '../chatwoot.service'
import { ChatwootConfigService } from '../config/chatwoot-config.service'
import { ContactService } from '../../contacts/services/contact.service'
import { SchedulerRegistry } from '@nestjs/schedule'
import { CronJob } from 'cron'
import { of } from 'rxjs'

jest.mock('cron', () => {
  return {
    CronJob: jest.fn().mockImplementation(() => ({
      start: jest.fn(),
    })),
  }
})

describe('ChatwootContactsCron', () => {
  let cron: ChatwootContactsCron
  let chatwootService: ChatwootService
  let contactService: ContactService
  let schedulerRegistry: SchedulerRegistry

  const mockConfigService = {
    isSyncEnabled: true,
    cronSchedule: '0 0 * * *',
  }

  const mockChatwootService = {
    syncContact: jest.fn(),
  }

  const mockContactService = {
    findAllPaginated: jest.fn(),
    findByEmail: jest.fn(),
    findOne: jest.fn(),
  }

  const mockSchedulerRegistry = {
    addCronJob: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatwootContactsCron,
        { provide: ChatwootConfigService, useValue: mockConfigService },
        { provide: ChatwootService, useValue: mockChatwootService },
        { provide: ContactService, useValue: mockContactService },
        { provide: SchedulerRegistry, useValue: mockSchedulerRegistry },
      ],
    }).compile()

    cron = module.get<ChatwootContactsCron>(ChatwootContactsCron)
    chatwootService = module.get<ChatwootService>(ChatwootService)
    contactService = module.get<ContactService>(ContactService)
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry)
  })

  it('should be defined', () => {
    expect(cron).toBeDefined()
  })

  describe('onModuleInit', () => {
    it('should schedule cron if sync is enabled', () => {
      // Mock true is default in mockConfigService setup
      cron.onModuleInit()
      expect(mockSchedulerRegistry.addCronJob).toHaveBeenCalledWith(
        'chatwoot_contacts_sync',
        expect.any(Object),
      )
    })

    it('should not schedule cron if sync is disabled', async () => {
      const disabledConfig = { isSyncEnabled: false, cronSchedule: '0 0 * * *' }
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ChatwootContactsCron,
          { provide: ChatwootConfigService, useValue: disabledConfig },
          { provide: ChatwootService, useValue: mockChatwootService },
          { provide: ContactService, useValue: mockContactService },
          { provide: SchedulerRegistry, useValue: mockSchedulerRegistry },
        ],
      }).compile()

      const disabledCron =
        module.get<ChatwootContactsCron>(ChatwootContactsCron)

      disabledCron.onModuleInit()
      expect(mockSchedulerRegistry.addCronJob).not.toHaveBeenCalled()
    })
  })

  describe('handleCron', () => {
    it('should sync all contacts if enabled', async () => {
      mockContactService.findAllPaginated.mockReturnValueOnce(
        of({
          data: [{ email: 'test@test.com' }],
          total: 1,
          page: 1,
          limit: 100,
        }),
      )

      await cron.handleCron()

      expect(contactService.findAllPaginated).toHaveBeenCalled()
      expect(chatwootService.syncContact).toHaveBeenCalled()
    })

    it('should not run if disabled (runtime check)', async () => {
      // Create a cron instance with a config that returns false for enabled
      // We need to mock the property access
      const runtimeDisabledConfig = {
        isSyncEnabled: false,
        cronSchedule: '0 0 * * *',
      }

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ChatwootContactsCron,
          { provide: ChatwootConfigService, useValue: runtimeDisabledConfig },
          { provide: ChatwootService, useValue: mockChatwootService },
          { provide: ContactService, useValue: mockContactService },
          { provide: SchedulerRegistry, useValue: mockSchedulerRegistry },
        ],
      }).compile()

      const disabledCron =
        module.get<ChatwootContactsCron>(ChatwootContactsCron)

      await disabledCron.handleCron()
      expect(contactService.findAllPaginated).not.toHaveBeenCalled()
    })
  })
})
