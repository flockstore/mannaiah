import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from './config.service'
import { ConfigModule } from '@nestjs/config'
import { validateUtil } from './validate.util'
import { CoreEnvironmentVariables } from './core.env'

describe('ConfigService', () => {
  let service: ConfigService

  beforeEach(async () => {
    process.env.MANNAIAH_PORT = '3000'
    process.env.NODE_ENV = 'test'

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          validate: (config) => validateUtil(CoreEnvironmentVariables, config),
          ignoreEnvFile: true,
        }),
      ],
      providers: [ConfigService],
    }).compile()

    service = module.get<ConfigService>(ConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should return the correct port', () => {
    expect(service.port).toBe(3000)
  })

  it('should return the correct nodeEnv', () => {
    expect(service.nodeEnv).toBe('test')
  })
})
