import { Test, TestingModule } from '@nestjs/testing'
import { ProductsService } from './products.service'
import { ProductsRepository } from './products.repository'
import { AssetsService } from '../assets/assets.service'
import { VariationsService } from '../variations/variations.service'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { of } from 'rxjs'

describe('ProductsService', () => {
  let service: ProductsService

  const mockProductsRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  }

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
          provide: ProductsRepository,
          useValue: mockProductsRepository,
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

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a product', async () => {
      const dto = { sku: 'SKU1' }
      mockProductsRepository.create.mockReturnValue(of(dto))
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

    it('should fallback to main SKU if variant SKU is missing on create', async () => {
      const dto = {
        sku: 'MAIN_SKU',
        variants: [
          { variationIds: ['v1'], sku: 'VAR_SKU' },
          { variationIds: ['v2'] }, // Missing SKU
        ],
      }
      const expectedDto = {
        sku: 'MAIN_SKU',
        variants: [
          { variationIds: ['v1'], sku: 'VAR_SKU' },
          { variationIds: ['v2'], sku: 'MAIN_SKU' },
        ],
      }

      mockProductsRepository.create.mockReturnValue(of(expectedDto))
      await service.create(dto as any)

      expect(mockProductsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          variants: expectedDto.variants,
        }),
      )
    })
  })

  describe('findAll', () => {
    it('should return all products', async () => {
      const products = [{ sku: 'SKU1' }]
      mockProductsRepository.findAll.mockReturnValue(of(products))
      const result = await service.findAll()
      expect(result).toEqual(products)
    })
  })

  describe('findOne', () => {
    it('should return a product if found', async () => {
      const product = { sku: 'SKU1' }
      mockProductsRepository.findById.mockReturnValue(of(product))
      const result = await service.findOne('id')
      expect(result).toEqual(product)
    })

    it('should throw NotFoundException if not found', async () => {
      mockProductsRepository.findById.mockReturnValue(of(null))
      await expect(service.findOne('id')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update a product', async () => {
      const dto = { sku: 'SKU2' }
      const updatedProduct = { sku: 'SKU2' }
      mockProductsRepository.update.mockReturnValue(of(updatedProduct))
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const result = await service.update('id', dto as any)
      expect(result).toEqual(updatedProduct)
    })

    it('should fully replace datasheets array on update', async () => {
      // Scenario: Existing had [A, B], updating with [A] -> Result should be [A] passed to repo
      const dto = {
        datasheets: [{ realm: 'default', name: 'Updated Product' }],
      }
      const updatedProduct = {
        sku: 'SKU1',
        datasheets: dto.datasheets,
      }

      mockProductsRepository.update.mockReturnValue(of(updatedProduct))

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await service.update('id', dto as any)

      // Verify repository is called with the exact array, implying replacement logic in repo
      expect(mockProductsRepository.update).toHaveBeenCalledWith('id', dto)
    })

    it('should fallback to main SKU if variant SKU is missing on update', async () => {
      const dto = {
        variants: [
          { variationIds: ['v1'], sku: 'VAR_SKU' },
          { variationIds: ['v2'] }, // Missing SKU
        ],
      }
      const existingProduct = { sku: 'MAIN_SKU' }
      const expectedVariants = [
        { variationIds: ['v1'], sku: 'VAR_SKU' },
        { variationIds: ['v2'], sku: 'MAIN_SKU' },
      ]

      mockProductsRepository.findById.mockReturnValue(of(existingProduct))
      mockProductsRepository.update.mockReturnValue(
        of({ ...existingProduct, variants: expectedVariants }),
      )

      await service.update('id', dto as any)

      expect(mockProductsRepository.findById).toHaveBeenCalledWith('id')
      expect(mockProductsRepository.update).toHaveBeenCalledWith(
        'id',
        expect.objectContaining({
          variants: expectedVariants,
        }),
      )
    })

    it('should throw NotFoundException if not found', async () => {
      mockProductsRepository.update.mockReturnValue(of(null))
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await expect(service.update('id', {} as any)).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    it('should remove a product', async () => {
      const deletedProduct = { sku: 'SKU1' }
      mockProductsRepository.softDelete.mockReturnValue(of(deletedProduct))
      await service.remove('id')
      expect(mockProductsRepository.softDelete).toHaveBeenCalledWith('id')
    })

    it('should throw NotFoundException if not found', async () => {
      mockProductsRepository.softDelete.mockReturnValue(of(null))
      await expect(service.remove('id')).rejects.toThrow(NotFoundException)
    })
  })
})
