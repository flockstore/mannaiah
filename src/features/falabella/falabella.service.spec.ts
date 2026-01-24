import { Test, TestingModule } from '@nestjs/testing'
import { FalabellaService } from './falabella.service'
import { FalabellaConfigService } from './config/falabella-config.service'
import axios from 'axios'
import { ProductsService } from '../products/products.service'

// Mock axios globally
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('FalabellaService', () => {
  let service: FalabellaService
  let configServiceMock: any
  let productsServiceMock: any

  const mockConfigService = {
    isConfigured: jest.fn(),
    apiKey: 'test-api-key',
    userId: 'test-user-id',
    userAgent: 'test-user-agent',
  }

  const mockProductsService = {
    findAll: jest.fn(),
  }

  // Mock interceptors
  const mockInterceptors = {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  }

  const mockAxiosInstance = {
    interceptors: mockInterceptors,
    get: jest.fn(),
  }

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup axios.create to return our mock instance
    // Note: mockReturnValue must be set BEFORE the module is compiled/service instantiated
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any)
    mockedAxios.isAxiosError.mockImplementation((payload) => !!(payload && (payload as any).isAxiosError))

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FalabellaService,
        {
          provide: FalabellaConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile()

    service = module.get<FalabellaService>(FalabellaService)
    configServiceMock = module.get(FalabellaConfigService)

    // Ensure config allows logic to run
    mockConfigService.isConfigured.mockReturnValue(true)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
    expect(axios.create).toHaveBeenCalled()
  })

  it('should register interceptors on init', () => {
    expect(mockInterceptors.request.use).toHaveBeenCalled()
    expect(mockInterceptors.response.use).toHaveBeenCalled()
  })

  describe('onModuleInit', () => {
    it('should enable service on successful connection', async () => {
      mockAxiosInstance.get.mockResolvedValue({ status: 200, data: { SuccessResponse: {} } })

      await service.onModuleInit()

      // Access private property for testing if possible, or verify behavior that depends on it
      expect((service as any).isEnabled).toBe(true)
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/', { params: { Action: 'GetBrands' } })
    })

    it('should disable service on failed connection', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection failed'))

      await service.onModuleInit()

      expect((service as any).isEnabled).toBe(false)
    })

    it('should disable service if not configured', async () => {
      mockConfigService.isConfigured.mockReturnValue(false)

      await service.onModuleInit()

      expect((service as any).isEnabled).toBe(false)
      expect(mockAxiosInstance.get).not.toHaveBeenCalled()
    })
  })

  describe('testConnection', () => {
    it('should return success if axios get succeeds', async () => {
      mockAxiosInstance.get.mockResolvedValue({ status: 200, data: {} })

      const result = await service.testConnection()
      expect(result.success).toBe(true)
      expect(result.message).toBe('Connection Successful')
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/', { params: { Action: 'GetBrands' } })
    })

    it('should return failure if axios get fails', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network Error'))

      const result = await service.testConnection()
      expect(result.success).toBe(false)
      expect(result.message).toContain('Network Error')
    })
  })

  describe('Interceptors Logic', () => {
    it('should have attached request interceptor', () => {
      expect(mockInterceptors.request.use).toHaveBeenCalled()
    })

    it('should sign request in interceptor', () => {
      // Retrieve the request interceptor callback
      const requestInterceptor = mockInterceptors.request.use.mock.calls[0][0];

      const config = {
        params: { Action: 'Test' },
        headers: {
          set: jest.fn()
        }
      } as any;

      const signedConfig = requestInterceptor(config);

      expect(signedConfig.params).toHaveProperty('UserID', 'test-user-id');
      expect(signedConfig.params).toHaveProperty('Signature');
      expect(signedConfig.params['Signature']).toHaveLength(64); // SHA256 hex
      expect(config.headers.set).toHaveBeenCalledWith('SELLER_ID', 'test-user-agent');
    })
  })
  describe('createProduct / syncProducts', () => {
    beforeEach(() => {
      (service as any).isEnabled = true; // force enable
      mockAxiosInstance.get.mockResolvedValue({});
      mockAxiosInstance.post = jest.fn().mockResolvedValue({ data: { success: true } });
    });

    it('should return sync result', async () => {
      mockProductsService.findAll.mockResolvedValue([
        { sku: 'SKU1', datasheets: [{ realm: 'default', name: 'P1', description: 'd' }], gallery: [] },
        { sku: 'SKU2', datasheets: [{ realm: 'default', name: 'P2', description: 'd' }], gallery: [] }
      ]);

      const result = await service.syncProducts();

      expect(mockProductsService.findAll).toHaveBeenCalled();
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
      expect(result.total).toBe(2);
      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should report failures in sync', async () => {
      mockProductsService.findAll.mockResolvedValue([
        { sku: 'SKU1', datasheets: [{ realm: 'default', name: 'P1', description: 'd' }], gallery: [] }
      ]);
      mockAxiosInstance.post.mockRejectedValue(new Error('fail'));

      const result = await service.syncProducts();

      expect(result.failed).toBe(1);
      expect(result.errors[0].sku).toBe('SKU1');
      expect(result.errors[0].error).toContain('fail');
    });
  });
})
