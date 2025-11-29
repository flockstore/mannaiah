import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { MongoConfigService } from './mongo.config'

describe('MongoConfigService', () => {
  let service: MongoConfigService
  let configService: ConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MongoConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<MongoConfigService>(MongoConfigService)
    configService = module.get<ConfigService>(ConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('uri', () => {
    it('should return the uri when defined', () => {
      jest
        .spyOn(configService, 'get')
        .mockReturnValue('mongodb://localhost:27017')
      expect(service.uri).toBe('mongodb://localhost:27017')
    })

    it('should throw an error when uri is undefined', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined)
      expect(() => service.uri).toThrow('MANNAIAH_MONGO_URI is not defined')
    })
  })

  describe('dbName', () => {
    it('should return the dbName when defined', () => {
      jest.spyOn(configService, 'get').mockReturnValue('test_db')
      expect(service.dbName).toBe('test_db')
    })

    it('should throw an error when dbName is undefined', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined)
      expect(() => service.dbName).toThrow(
        'MANNAIAH_MONGO_DB_NAME is not defined',
      )
    })
  })
})
