import { Test, TestingModule } from '@nestjs/testing'
import { AssetsService } from './assets.service'
import { AssetsRepository } from './assets.repository'
import { StorageService } from '../../core/storage/storage.service'
import { randomUUID } from 'crypto'
import { of } from 'rxjs'
import { NotFoundException } from '@nestjs/common'

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
    update: jest.fn(),
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

    it('should use custom name if provided', async () => {
      const file = {
        originalname: 'test.png',
        mimetype: 'image/png',
        buffer: Buffer.from('test'),
        size: 1024,
      } as Express.Multer.File

      const customName = 'custom-name.png'
      const uploadResult = { Key: 'uploads/uuid-test.png' }
      mockStorageService.uploadFile.mockResolvedValue(uploadResult)

      const createdAsset = {
        _id: 'some-uuid',
        originalName: customName,
        mimeType: 'image/png',
        size: 1024,
        key: 'uploads/uuid-test.png',
      }

      mockAssetsRepository.create.mockReturnValue(of(createdAsset))

      const result = await service.create(file, customName)

      expect(mockAssetsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          originalName: customName,
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

  describe('update', () => {
    it('should update and return an asset', async () => {
      const mockAsset = { _id: 'uuid', originalName: 'old-name.png' }
      const dto = { originalName: 'new-name.png' }
      const updatedAsset = { ...mockAsset, ...dto }
      mockAssetsRepository.update.mockReturnValue(of(updatedAsset))

      const result = await service.update('uuid', dto)
      expect(mockAssetsRepository.update).toHaveBeenCalledWith('uuid', dto)
      expect(result).toEqual(updatedAsset)
    })

    it('should throw NotFoundException if asset not found for update', async () => {
      mockAssetsRepository.update.mockReturnValue(of(null))
      await expect(
        service.update('uuid', { originalName: 'test' }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('findAllPaginated', () => {
    it('should forward parameters directly to repository', () => {
      const filter = {
        name: 'test',
        excludeIds: ['1', '2'],
        sort: { name: 1 },
      }
      const page = 1
      const limit = 10

      mockAssetsRepository.findAllPaginated.mockReturnValue(
        of({ data: [], total: 0, page, limit }),
      )

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      service.findAllPaginated(filter as any, page, limit)

      // AssetsService simply forwards the call; BaseRepository handles logic
      expect(mockAssetsRepository.findAllPaginated).toHaveBeenCalledWith(
        filter,
        page,
        limit,
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
