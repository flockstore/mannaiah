/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing'
import { StorageService } from './storage.service'
import { StorageConfigService } from './config/storage.config'
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { mockClient } from 'aws-sdk-client-mock'
import { Readable } from 'stream'
import { Logger } from '@nestjs/common'

describe('StorageService', () => {
  let service: StorageService
  const s3Mock = mockClient(S3Client)
  let loggerSpy: jest.SpyInstance

  const mockConfig = {
    isEnabled: true,
    endpoint: 'http://localhost:9000',
    region: 'us-east-1',
    accessKey: 'test',
    secretKey: 'test',
    bucketName: 'test-bucket',
    forcePathStyle: true,
  }

  beforeEach(() => {
    s3Mock.reset()
    loggerSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('When Storage is Enabled', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: StorageConfigService,
            useValue: mockConfig,
          },
        ],
      }).compile()

      service = module.get<StorageService>(StorageService)
    })

    it('should be defined', () => {
      expect(service).toBeDefined()
    })

    it('should log a warning if credentials are missing', async () => {
      jest.clearAllMocks() // Clear previous instantiations
      loggerSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => {})

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: StorageConfigService,
            useValue: {
              ...mockConfig,
              accessKey: undefined,
              secretKey: undefined,
            },
          },
        ],
      }).compile()

      module.get<StorageService>(StorageService)
      expect(loggerSpy).toHaveBeenCalledWith(
        'Missing S3 credentials. Storage operations may fail if authentication is required.',
      )
    })

    it('should upload a file', async () => {
      s3Mock.on(PutObjectCommand).resolves({})
      await service.uploadFile('test-key', Buffer.from('test'), 'text/plain')
      expect(s3Mock.calls()).toHaveLength(1)
    })

    it('should get a file', async () => {
      const stream = new Readable()
      stream.push('test content')
      stream.push(null)

      s3Mock.on(GetObjectCommand).resolves({
        Body: stream as any,
      })

      const result = await service.getFile('test-key')
      expect(result).toBeDefined()
      expect(s3Mock.calls()).toHaveLength(1)
    })

    it('should delete a file', async () => {
      s3Mock.on(DeleteObjectCommand).resolves({})
      await service.deleteFile('test-key')
      expect(s3Mock.calls()).toHaveLength(1)
    })
  })

  describe('When Storage is Disabled', () => {
    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: StorageConfigService,
            useValue: {
              ...mockConfig,
              isEnabled: false,
            },
          },
        ],
      }).compile()

      service = module.get<StorageService>(StorageService)
    })

    it('should warn that storage is disabled on initialization', () => {
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Storage is disabled'),
      )
    })

    it('should throw error when calling uploadFile', async () => {
      await expect(service.uploadFile('key', 'body')).rejects.toThrow(
        'Storage is disabled',
      )
    })

    it('should throw error when calling getFile', async () => {
      await expect(service.getFile('key')).rejects.toThrow(
        'Storage is disabled',
      )
    })

    it('should throw error when calling deleteFile', async () => {
      await expect(service.deleteFile('key')).rejects.toThrow(
        'Storage is disabled',
      )
    })
  })

  describe('Configuration Validation', () => {
    it('should throw error if endpoint is missing when enabled', async () => {
      const promise = Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: StorageConfigService,
            useValue: { ...mockConfig, endpoint: undefined },
          },
        ],
      }).compile()

      await expect(promise).rejects.toThrow('STORAGE_ENDPOINT is required')
    })

    it('should throw error if region is missing when enabled', async () => {
      const promise = Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: StorageConfigService,
            useValue: { ...mockConfig, region: undefined },
          },
        ],
      }).compile()

      await expect(promise).rejects.toThrow('STORAGE_REGION is required')
    })

    it('should throw error if bucket name is missing when enabled', async () => {
      const promise = Test.createTestingModule({
        providers: [
          StorageService,
          {
            provide: StorageConfigService,
            useValue: { ...mockConfig, bucketName: undefined },
          },
        ],
      }).compile()

      await expect(promise).rejects.toThrow('STORAGE_BUCKET_NAME is required')
    })
  })
})
