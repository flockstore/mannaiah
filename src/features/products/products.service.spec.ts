import { Test, TestingModule } from '@nestjs/testing'
import { ProductsService } from './products.service'
import { getModelToken } from '@nestjs/mongoose'
import { Product } from './schemas/product.schema'
import { AssetsService } from '../assets/assets.service'
import { VariationsService } from '../variations/variations.service'
import {
  // ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'

class MockProductModel {
  save: any
  constructor(private data: any) {
    Object.assign(this, data)
    this.save = jest.fn().mockResolvedValue(this.data)
  }
  static find = jest.fn()
  static findById = jest.fn()
  static findByIdAndUpdate = jest.fn()
  static findByIdAndDelete = jest.fn()
}

describe('ProductsService', () => {
  let service: ProductsService
  // let assetsService: AssetsService
  // let variationsService: VariationsService

  const mockAssetsService = {
    findOne: jest.fn().mockResolvedValue({}),
  }

  const mockVariationsService = {
    findOne: jest.fn().mockResolvedValue({}),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: MockProductModel,
        },
        {
          provide: AssetsService,
          useValue: mockAssetsService,
        },
        {
          provide: VariationsService,
          useValue: mockVariationsService,
        },
      ],
    }).compile()

    service = module.get<ProductsService>(ProductsService)
    // assetsService = module.get<AssetsService>(AssetsService)
    // variationsService = module.get<VariationsService>(VariationsService)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a product', async () => {
      const dto = { sku: 'SKU1' }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.create(dto as any)
      expect(result).toEqual(dto)
    })

    it('should fail with double main images', async () => {
      const dto = {
        sku: 'SKU_BAD',
        gallery: [
          { assetId: 'a1', isMain: true },
          { assetId: 'a2', isMain: true },
        ],
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(service.create(dto as any)).rejects.toThrow(
        BadRequestException,
      )
    })

    it('should fail if asset not found', async () => {
      mockAssetsService.findOne.mockRejectedValueOnce(new NotFoundException())
      const dto = {
        sku: 'SKU_ASSET',
        gallery: [{ assetId: 'bad_asset' }],
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(service.create(dto as any)).rejects.toThrow(
        BadRequestException,
      )
    })
  })

  // ... (Other tests similar to before, adapted if needed)
})
