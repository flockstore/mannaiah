/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing'
import { ChatwootContactsCron } from './chatwoot-contacts.cron'
import { ChatwootService } from '../chatwoot.service'
import { ChatwootConfigService } from '../config/chatwoot-config.service'
import { ContactService } from '../../contacts/services/contact.service'
import { of } from 'rxjs'

describe('ChatwootContactsCron', () => {
  let cron: ChatwootContactsCron
  let chatwootService: ChatwootService
  let contactService: ContactService

  const mockConfigService = {
    isCronEnabled: true,
  }

  const mockChatwootService = {
    syncContact: jest.fn(),
  }

  const mockContactService = {
    findAllPaginated: jest.fn(),
    findByEmail: jest.fn(),
    findOne: jest.fn(),
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatwootContactsCron,
        { provide: ChatwootConfigService, useValue: mockConfigService },
        { provide: ChatwootService, useValue: mockChatwootService },
        { provide: ContactService, useValue: mockContactService },
      ],
    }).compile()

    cron = module.get<ChatwootContactsCron>(ChatwootContactsCron)
    chatwootService = module.get<ChatwootService>(ChatwootService)
    contactService = module.get<ContactService>(ContactService)
  })

  it('should be defined', () => {
    expect(cron).toBeDefined()
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

    it('should not run if disabled', async () => {
      // Re-compile module with disabled config to ensure clean state or use spy
      const disabledConfig = { isCronEnabled: false }
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ChatwootContactsCron,
          { provide: ChatwootConfigService, useValue: disabledConfig },
          { provide: ChatwootService, useValue: mockChatwootService },
          { provide: ContactService, useValue: mockContactService },
        ],
      }).compile()

      const disabledCron =
        module.get<ChatwootContactsCron>(ChatwootContactsCron)
      await disabledCron.handleCron()
      expect(contactService.findAllPaginated).not.toHaveBeenCalled()
    })
  })
})
