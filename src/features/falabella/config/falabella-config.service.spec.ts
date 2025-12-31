import { Test, TestingModule } from '@nestjs/testing'
import { FalabellaConfigService } from './falabella-config.service'

describe('FalabellaConfigService', () => {
  let service: FalabellaConfigService
  let updatedConfigStub: Record<string, any>

  beforeEach(async () => {
    updatedConfigStub = {}

    const module: TestingModule = await Test.createTestingModule({
      providers: [FalabellaConfigService],
    }).compile()

    service = module.get<FalabellaConfigService>(FalabellaConfigService)
    jest
      .spyOn(service, 'get')
      .mockImplementation((key: string) => updatedConfigStub[key])
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('isConfigured', () => {
    it('should return true when both user ID and API key are present', () => {
      updatedConfigStub = {
        FALABELLA_USER_ID: 'user',
        FALABELLA_API_KEY: 'key',
      }
      expect(service.isConfigured()).toBe(true)
    })

    it('should return false when user ID is missing', () => {
      updatedConfigStub = {
        FALABELLA_API_KEY: 'key',
      }
      expect(service.isConfigured()).toBe(false)
    })

    it('should return false when API key is missing', () => {
      updatedConfigStub = {
        FALABELLA_USER_ID: 'user',
      }
      expect(service.isConfigured()).toBe(false)
    })
  })

  describe('getters', () => {
    it('should return userId', () => {
      updatedConfigStub = { FALABELLA_USER_ID: 'test-user' }
      expect(service.userId).toBe('test-user')
    })

    it('should return apiKey', () => {
      updatedConfigStub = { FALABELLA_API_KEY: 'test-key' }
      expect(service.apiKey).toBe('test-key')
    })
  })
})
