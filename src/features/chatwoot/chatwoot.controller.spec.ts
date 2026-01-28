import { Test, TestingModule } from '@nestjs/testing'
import { ChatwootController } from './chatwoot.controller'
import { ChatwootContactsCron } from './cron/chatwoot-contacts.cron'
import { ChatwootConfigService } from './config/chatwoot-config.service'
import { BadRequestException } from '@nestjs/common'

describe('ChatwootController', () => {
  let controller: ChatwootController

  const mockCron = {
    syncAll: jest.fn().mockResolvedValue(undefined),
    syncByEmails: jest.fn().mockResolvedValue(undefined),
  }

  const mockConfigService = {
    isSyncEnabled: true,
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatwootController],
      providers: [
        { provide: ChatwootContactsCron, useValue: mockCron },
        { provide: ChatwootConfigService, useValue: mockConfigService },
      ],
    }).compile()

    controller = module.get<ChatwootController>(ChatwootController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('triggerSync', () => {
    it('should throw BadRequest if sync disabled', async () => {
      Object.defineProperty(mockConfigService, 'isSyncEnabled', {
        value: false,
      })
      await expect(controller.triggerSync()).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should trigger syncAll when no emails provided', () => {
      Object.defineProperty(mockConfigService, 'isSyncEnabled', { value: true })
      controller.triggerSync()
      expect(mockCron.syncAll).toHaveBeenCalled()
    })

    it('should trigger syncByEmails when emails provided', () => {
      Object.defineProperty(mockConfigService, 'isSyncEnabled', { value: true })
      controller.triggerSync('a@b.com,c@d.com')
      expect(mockCron.syncByEmails).toHaveBeenCalledWith(['a@b.com', 'c@d.com'])
    })
  })
})
