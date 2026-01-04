
import { Test, TestingModule } from '@nestjs/testing'
import { FalabellaSyncService } from './falabella-sync.service'
import { FalabellaService } from './falabella.service'
import { ProductsService } from '../products/products.service'
import { AssetsService } from '../assets/assets.service'

describe('FalabellaSyncService', () => {
    let service: FalabellaSyncService
    let falabellaService: FalabellaService
    let productsService: ProductsService
    let assetsService: AssetsService

    const mockProduct = {
        sku: 'SKU123',
        variants: [],
        gallery: [],
        datasheets: [
            {
                realm: 'falabella',
                name: 'Test Product',
                description: 'Test Description',
                attributes: {
                    brand: 'Generic',
                    category: 'Default',
                },
            },
        ],
    }

    const mockFalabellaService = {
        createProduct: jest.fn(),
        uploadImage: jest.fn(),
    }

    const mockProductsService = {
        findAll: jest.fn().mockResolvedValue([mockProduct]),
    }

    const mockAssetsService = {
        findOne: jest.fn(),
        getPublicUrl: jest.fn(),
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FalabellaSyncService,
                { provide: FalabellaService, useValue: mockFalabellaService },
                { provide: ProductsService, useValue: mockProductsService },
                { provide: AssetsService, useValue: mockAssetsService },
            ],
        }).compile()

        service = module.get<FalabellaSyncService>(FalabellaSyncService)
        falabellaService = module.get<FalabellaService>(FalabellaService)
        productsService = module.get<ProductsService>(ProductsService)
        assetsService = module.get<AssetsService>(AssetsService)

        jest.clearAllMocks()
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })

    it('should sync simple products', async () => {
        mockProductsService.findAll.mockResolvedValueOnce([mockProduct])
        await service.syncProducts()
        expect(productsService.findAll).toHaveBeenCalled()
        expect(falabellaService.createProduct).toHaveBeenCalledWith(
            expect.objectContaining({
                SellerSku: 'SKU123',
                Name: 'Test Product',
            }),
        )
    })

    it('should sync product with variations', async () => {
        const productWithVariants = {
            ...mockProduct,
            variants: [{ sku: 'SKU123-1', variationIds: ['var1'] }],
        }
        mockProductsService.findAll.mockResolvedValueOnce([productWithVariants])

        await service.syncProducts()

        // Expect call for parent
        expect(mockFalabellaService.createProduct).toHaveBeenCalledWith(
            expect.objectContaining({
                SellerSku: 'SKU123',
                ParentSku: undefined,
            }),
        )

        // Expect call for child
        expect(mockFalabellaService.createProduct).toHaveBeenCalledWith(
            expect.objectContaining({
                SellerSku: 'SKU123-1',
                ParentSku: 'SKU123',
            }),
        )
    })

    it('should sync images when present', async () => {
        const productWithImages = {
            ...mockProduct,
            gallery: [{ assetId: 'asset1' }],
        }
        mockProductsService.findAll.mockResolvedValueOnce([productWithImages])
        mockAssetsService.getPublicUrl.mockResolvedValue('https://minio.example.com/bucket/key.jpg')

        await service.syncProducts()

        expect(assetsService.getPublicUrl).toHaveBeenCalledWith('asset1')
        expect(falabellaService.uploadImage).toHaveBeenCalledWith(
            expect.objectContaining({
                SellerSku: 'SKU123',
                Images: expect.arrayContaining(['https://minio.example.com/bucket/key.jpg'])
            })
        )
    })
})
