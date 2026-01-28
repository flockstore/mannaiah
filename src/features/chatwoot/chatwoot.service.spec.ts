/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing'
import { HttpService } from '@nestjs/axios'
import { ChatwootService } from './chatwoot.service'
import { ChatwootConfigService } from './config/chatwoot-config.service'
import { of, throwError } from 'rxjs'
import { ContactDocument } from '../../contacts/interfaces/contact.interface'

describe('ChatwootService', () => {
  let service: ChatwootService
  let httpService: HttpService

  const mockConfigService = {
    isConfigured: jest.fn(),
    isSyncEnabled: false,
    url: 'https://test.chatwoot.com',
    accountId: '1',
    apiKey: 'test-key',
  }

  const mockHttpService = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatwootService,
        { provide: ChatwootConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile()

    service = module.get<ChatwootService>(ChatwootService)
    httpService = module.get<HttpService>(HttpService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('onModuleInit', () => {
    it('should not verify credentials if not configured', async () => {
      mockConfigService.isConfigured.mockReturnValue(false)
      await service.onModuleInit()

      expect(httpService.get).not.toHaveBeenCalled()
    })

    it('should verify credentials if configured and sync enabled', async () => {
      mockConfigService.isConfigured.mockReturnValue(true)
      Object.defineProperty(mockConfigService, 'isSyncEnabled', { value: true })

      mockHttpService.get.mockReturnValue(of({ data: {} }))

      await service.onModuleInit()

      expect(httpService.get).toHaveBeenCalled()
    })
  })

  describe('syncContact', () => {
    const contact = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '1234567890',
    } as unknown as ContactDocument

    beforeEach(() => {
      service['isEnabled'] = true
      jest.clearAllMocks()
    })

    it('should update existing contact', async () => {
      mockHttpService.get.mockReturnValue(
        of({ data: { payload: [{ id: 123 }] } }),
      )
      mockHttpService.put.mockReturnValue(of({ data: {} }))

      await service.syncContact(contact)

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('/contacts/search?q=test@example.com'),
        expect.any(Object),
      )

      expect(httpService.put).toHaveBeenCalledWith(
        expect.stringContaining('/contacts/123'),
        expect.any(Object),
        expect.any(Object),
      )
    })

    it('should create new contact if not found', async () => {
      mockHttpService.get.mockReturnValue(of({ data: { payload: [] } }))
      mockHttpService.post.mockReturnValue(of({ data: {} }))

      await service.syncContact(contact)

      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/contacts'),
        expect.objectContaining({ email: 'test@example.com' }),
        expect.any(Object),
      )
    })

    it('should retry on 429 error and succeed', async () => {
      mockHttpService.get
        .mockReturnValueOnce(
          throwError(() => ({ response: { status: 429, data: 'Rate Limit' } })),
        )
        .mockReturnValueOnce(of({ data: { payload: [{ id: 123 }] } }))

      mockHttpService.put.mockReturnValue(of({ data: {} }))

      const sleepSpy = jest
        .spyOn(service as any, 'sleep')
        .mockResolvedValue(undefined)

      await service.syncContact(contact)

      expect(sleepSpy).toHaveBeenCalledTimes(1)
      expect(httpService.get).toHaveBeenCalledTimes(2)
      expect(httpService.put).toHaveBeenCalledWith(
        expect.stringContaining('/contacts/123'),
        expect.any(Object),
        expect.any(Object),
      )
    })

    it('should abort sync if search fails permanently', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => ({
          message: 'Network Error',
          response: { status: 500 }
        })),
      )

      await service.syncContact(contact)

      expect(httpService.post).not.toHaveBeenCalled()
      expect(httpService.put).not.toHaveBeenCalled()
    })
  })
})
