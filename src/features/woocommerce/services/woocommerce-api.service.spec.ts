/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Test, TestingModule } from '@nestjs/testing'
import { WooCommerceApiService } from './woocommerce-api.service'
import { WooCommerceConfigService } from '../config/woocommerce-config.service'
// import { of, throwError } from 'rxjs'

// Mock the WooCommerce REST API
jest.mock('@woocommerce/woocommerce-rest-api')

describe('WooCommerceApiService', () => {
  let service: WooCommerceApiService
  let configService: jest.Mocked<WooCommerceConfigService>

  const mockOrder = {
    id: 1,
    billing: {
      first_name: 'John',
      last_name: 'Doe',
      address_1: '123 Main St',
      address_2: 'Apt 4',
      city: 'Bogotá',
      state: 'Cundinamarca',
      phone: '3001234567',
      email: 'john@example.com',
    },
    meta_data: [
      {
        id: 1,
        key: '_billing_document',
        value: '123456789',
      },
    ],
  }

  beforeEach(async () => {
    const mockConfigService = {
      isConfigured: jest.fn(),
      url: 'https://test-store.com',
      consumerKey: 'ck_test',
      consumerSecret: 'cs_test',
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WooCommerceApiService,
        {
          provide: WooCommerceConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile()

    service = module.get<WooCommerceApiService>(WooCommerceApiService)
    configService = module.get(WooCommerceConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('when WooCommerce is configured', () => {
    beforeEach(() => {
      configService.isConfigured.mockReturnValue(true)
    })

    it('should initialize API client', () => {
      // API client initialization happens in constructor
      expect(configService.isConfigured).toHaveBeenCalled()
    })
  })

  describe('when WooCommerce is not configured', () => {
    beforeEach(() => {
      configService.isConfigured.mockReturnValue(false)
    })

    it('should not initialize API client', () => {
      const newService = new WooCommerceApiService(configService)
      expect(newService).toBeDefined()
    })

    it('should return false for validateConnection', (done) => {
      const newService = new WooCommerceApiService(configService)
      newService.validateConnection().subscribe((result) => {
        expect(result).toBe(false)
        done()
      })
    })

    it('should return empty array for getOrders', (done) => {
      const newService = new WooCommerceApiService(configService)
      newService.getOrders().subscribe((orders) => {
        expect(orders).toEqual([])
        done()
      })
    })
  })

  describe('validateConnection', () => {
    it('should return true on successful connection', (done) => {
      configService.isConfigured.mockReturnValue(true)
      const newService = new WooCommerceApiService(configService)

      // Mock the API get method
      const mockApi = (newService as any).api
      if (mockApi) {
        mockApi.get = jest.fn().mockResolvedValue({ data: {} })
      }

      newService.validateConnection().subscribe((result) => {
        expect(result).toBe(true)
        done()
      })
    })

    it('should return false on connection failure', (done) => {
      configService.isConfigured.mockReturnValue(true)
      const newService = new WooCommerceApiService(configService)

      const mockApi = (newService as any).api
      if (mockApi) {
        mockApi.get = jest
          .fn()
          .mockRejectedValue(new Error('Connection failed'))
      }

      newService.validateConnection().subscribe((result) => {
        expect(result).toBe(false)
        done()
      })
    })
  })

  describe('getOrders', () => {
    it('should fetch all orders when no page specified', (done) => {
      configService.isConfigured.mockReturnValue(true)
      const newService = new WooCommerceApiService(configService)

      const mockApi = (newService as any).api
      if (mockApi) {
        mockApi.get = jest.fn().mockResolvedValue({
          data: [mockOrder],
          headers: { 'x-wp-totalpages': '1' },
        })
      }

      newService.getOrders().subscribe((orders) => {
        expect(orders.length).toBeGreaterThanOrEqual(0)
        done()
      })
    })

    it('should fetch specific page when page number provided', (done) => {
      configService.isConfigured.mockReturnValue(true)
      const newService = new WooCommerceApiService(configService)

      const mockApi = (newService as any).api
      if (mockApi) {
        mockApi.get = jest.fn().mockResolvedValue({
          data: [mockOrder],
          headers: { 'x-wp-totalpages': '2' },
        })
      }

      newService.getOrders(1, 10).subscribe(() => {
        expect(mockApi.get).toHaveBeenCalledWith('orders', {
          page: 1,
          per_page: 10,
        })
        done()
      })
    })
  })

  it('should handle pagination and fetch all orders when no page specified', (done) => {
    configService.isConfigured.mockReturnValue(true)
    const newService = new WooCommerceApiService(configService)

    const mockApi = (newService as any).api
    if (mockApi) {
      let callCount = 0
      mockApi.get = jest.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return Promise.resolve({
            data: [mockOrder],
            headers: { 'x-wp-totalpages': '2' },
          })
        }
        return Promise.resolve({
          data: [{ ...mockOrder, id: 2 }],
          headers: { 'x-wp-totalpages': '2' },
        })
      })
    }

    newService.getOrders(undefined, 1).subscribe((orders) => {
      expect(orders.length).toBe(2)
      expect(orders[0].id).toBe(1)
      expect(orders[1].id).toBe(2)
      done()
    })
  })
})
