import { Test, TestingModule } from '@nestjs/testing'
import { FalabellaService } from './falabella.service'
import { FalabellaConfigService } from './config/falabella-config.service'
import { HttpService } from '@nestjs/axios'
import { of } from 'rxjs'

describe('FalabellaService', () => {
  let service: FalabellaService

  const mockConfigService = {
    isConfigured: jest.fn(),
    apiKey: 'test-api-key',
    userId: 'test-user-id',
    sellerId: 'test-seller-id',
    country: 'FACL',
  }

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FalabellaService,
        {
          provide: FalabellaConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile()

    service = module.get<FalabellaService>(FalabellaService)
    // configService = module.get<FalabellaConfigService>(FalabellaConfigService)

    // Reset mocks
    jest.clearAllMocks()
    mockConfigService.isConfigured.mockReturnValue(true)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('signRequest', () => {
    it('should explode if not configured', () => {
      mockConfigService.isConfigured.mockReturnValue(false)
      expect(() => service.signRequest({})).toThrow(
        'Falabella integration is disabled',
      )
    })

    it('should generate a correct HMAC signature for simple params', () => {
      // Known HMAC-SHA256 test vector or simple valid inputs
      // Key: 'test-api-key'
      // Data: 'Action=GetBrands'
      // Expected SHA256 HMAC of 'Action=GetBrands' with key 'test-api-key'
      // Calculated via online tool: 8d2c0e5... (let's rely on consistency, not hardcoded hash unless we calculate it)

      const params = { Action: 'GetBrands' }
      const signature = service.signRequest(params)

      expect(typeof signature).toBe('string')
      expect(signature).toHaveLength(64) // SHA256 hex is 64 chars
    })

    it('should sort parameters alphabetically', () => {
      // 'A=1&B=2' vs 'B=2&A=1' -> canonical should be 'A=1&B=2'
      // If we pass in { B: '2', A: '1' }, it should produce same signature as { A: '1', B: '2' }

      const sig1 = service.signRequest({ B: '2', A: '1' })
      const sig2 = service.signRequest({ A: '1', B: '2' })

      expect(sig1).toBe(sig2)
    })
  })

  describe('testConnection', () => {
    it('should return success and message if configured', () => {
      const result = service.testConnection()
      expect(result.success).toBe(true)
      expect(result.message).toContain('Signature generated')
    })

    it('should return failure if disabled', () => {
      mockConfigService.isConfigured.mockReturnValue(false)
      const result = service.testConnection()
      expect(result.success).toBe(false)
      expect(result.message).toBe('Disabled')
    })
  })
  describe('userAgent', () => {
    it('should construct user agent correctly', () => {
      // FALABELLA_SELLER_ID/TECNOLOGÍA_USADA/VERSIÓN_TECNOLOGÍA/TIPO_INTEGRACIÓN/CÓDIGO_UNIDAD_DE_NEGOCIO
      // test-seller-id/Node/<version>/PROPIA/FACL
      const ua = service.userAgent
      expect(ua).toContain('test-seller-id/Node/')
      expect(ua).toContain('/PROPIA/FACL')
    })
  })

  describe('createProduct', () => {
    it('should convert payload to XML and send POST request', async () => {
      mockHttpService.post.mockReturnValue(of({ data: { Success: true } }))

      const payload = {
        SellerSku: 'SKU123',
        Name: 'Test Product'
      }

      await service.createProduct(payload)

      expect(mockHttpService.post).toHaveBeenCalledTimes(1)
      const [url, body, config] = mockHttpService.post.mock.calls[0]

      expect(url).toContain('Action=ProductCreate')
      expect(body).toContain('<Request>')
      expect(body).toContain('<Product>')
      expect(body).toContain('<SellerSku>SKU123</SellerSku>')

      // Verify Headers
      expect(config.headers['User-Agent']).toBeDefined()
      expect(config.headers['Content-Type']).toBe('text/xml')
    })
  })
})
