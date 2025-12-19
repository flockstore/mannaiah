/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing'
import { AssetsService } from './assets.service'
import { getModelToken } from '@nestjs/mongoose'
import { Asset } from './schemas/asset.schema'
import { StorageService } from '../../core/storage/storage.service'
import { randomUUID } from 'crypto'

describe('AssetsService', () => {
  let service: AssetsService
  let storageService: StorageService

  const mockStorageService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  }

  class MockAssetModel {
    save: any
    constructor(private data: any) {
      Object.assign(this, data)
      this.save = jest.fn().mockResolvedValue(this.data)
    }

    static findById = jest.fn()
    static findByIdAndDelete = jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetsService,
        { provide: getModelToken(Asset.name), useValue: MockAssetModel },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile()

    service = module.get<AssetsService>(AssetsService)
    storageService = module.get<StorageService>(StorageService)

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

      // The saved asset will depend on what's passed to constructor
      // We can't easily mock the return of new Model() to be exact object unless we spy on prototype or just check returned value structure

      const result = await service.create(file)

      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        expect.stringContaining(file.originalname),
        file.buffer,
        file.mimetype,
      )
      expect(result).toMatchObject({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      })
    })
  })

  describe('findOne', () => {
    it('should return asset if found', async () => {
      const assetId = randomUUID()
      const asset = { _id: assetId, key: 'test' }
      MockAssetModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(asset),
      })

      const result = await service.findOne(assetId)
      expect(result).toEqual(asset)
    })

    it('should throw NotFoundException if asset not found', async () => {
      MockAssetModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Asset with ID invalid-id not found',
      )
    })
  })

  describe('remove', () => {
    it('should delete file from S3 and remove record from DB', async () => {
      const assetId = randomUUID()
      const asset = { _id: assetId, key: 'test-key' }

      MockAssetModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(asset),
      })

      MockAssetModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      })

      await service.remove(assetId)

      expect(storageService.deleteFile).toHaveBeenCalledWith(asset.key)
      expect(MockAssetModel.findByIdAndDelete).toHaveBeenCalledWith(assetId)
    })
  })
})
