/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment */
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
  let configService: StorageConfigService
  const s3Mock = mockClient(S3Client)
  let loggerSpy: jest.SpyInstance

  beforeEach(async () => {
    s3Mock.reset()
    loggerSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => {})

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: StorageConfigService,
          useValue: {
            endpoint: 'http://localhost:9000',
            region: 'us-east-1',
            accessKey: 'test',
            secretKey: 'test',
            bucketName: 'test-bucket',
            forcePathStyle: true,
          },
        },
      ],
    }).compile()

    service = module.get<StorageService>(StorageService)
    configService = module.get<StorageConfigService>(StorageConfigService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should log a warning if credentials are missing', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: StorageConfigService,
          useValue: {
            endpoint: 'http://localhost:9000',
            region: 'us-east-1',
            accessKey: undefined,
            secretKey: undefined,
            bucketName: 'test-bucket',
            forcePathStyle: true,
          },
        },
      ],
    }).compile()

    module.get<StorageService>(StorageService)
    expect(loggerSpy).toHaveBeenCalledWith(
      'Missing S3 credentials. Storage operations may fail if authentication is required.',
    )
  })

  describe('uploadFile', () => {
    it('should upload a file', async () => {
      s3Mock.on(PutObjectCommand).resolves({})

      await service.uploadFile('test-key', Buffer.from('test'), 'text/plain')

      expect(s3Mock.calls()).toHaveLength(1)
    })
  })

  describe('getFile', () => {
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
  })

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      s3Mock.on(DeleteObjectCommand).resolves({})

      await service.deleteFile('test-key')

      expect(s3Mock.calls()).toHaveLength(1)
    })
  })
})
