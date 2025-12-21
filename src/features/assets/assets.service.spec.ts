import { Test, TestingModule } from '@nestjs/testing'
import { AssetsService } from './assets.service'
import { AssetsRepository } from './assets.repository'
import { StorageService } from '../../core/storage/storage.service'
import { randomUUID } from 'crypto'
import { of } from 'rxjs'

describe('AssetsService', () => {
  let service: AssetsService
  let storageService: StorageService
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let assetsRepository: AssetsRepository

  const mockStorageService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  }

  const mockAssetsRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    softDelete: jest.fn(),
    findAllPaginated: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: AssetsRepository, useValue: mockAssetsRepository },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile()

    service = module.get<AssetsService>(AssetsService)
    storageService = module.get<StorageService>(StorageService)
    assetsRepository = module.get<AssetsRepository>(AssetsRepository)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should upload file to S3 and save asset record', async () => {
      const file = {
        originalname: 'test.png',
        mimetype: 'image/png',
        buffer: Buffer.from('test'),
        size: 1024,
      } as Express.Multer.File

      const uploadResult = { Key: 'uploads/uuid-test.png' }
      mockStorageService.uploadFile.mockResolvedValue(uploadResult)

      const createdAsset = {
        _id: 'some-uuid',
        originalName: 'test.png',
        mimeType: 'image/png',
        size: 1024,
        key: 'uploads/uuid-test.png',
      }

      mockAssetsRepository.create.mockReturnValue(of(createdAsset))

      const result = await service.create(file)

      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        expect.stringContaining(file.originalname),
        file.buffer,
        file.mimetype,
      )

      expect(mockAssetsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        }),
      )
      expect(result).toEqual(createdAsset)
    })
  })

  describe('findOne', () => {
    it('should return asset if found', async () => {
      const assetId = randomUUID()
      const asset = { _id: assetId, key: 'test' }
      mockAssetsRepository.findById.mockReturnValue(of(asset))

      const result = await service.findOne(assetId)
      expect(result).toEqual(asset)
    })

    it('should throw NotFoundException if asset not found', async () => {
      mockAssetsRepository.findById.mockReturnValue(of(null))

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Asset with ID invalid-id not found',
      )
    })
  })

  describe('remove', () => {
    it('should delete file from S3 and remove record from DB', async () => {
      const assetId = randomUUID()
      const asset = { _id: assetId, key: 'test-key' }

      mockAssetsRepository.findById.mockReturnValue(of(asset))
      mockAssetsRepository.softDelete.mockReturnValue(
        of({ ...asset, isDeleted: true }),
      )

      await service.remove(assetId)

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(storageService.deleteFile).toHaveBeenCalledWith(asset.key)

      expect(mockAssetsRepository.softDelete).toHaveBeenCalledWith(assetId)
    })
  })
})
