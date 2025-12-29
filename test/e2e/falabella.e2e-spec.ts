import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { FalabellaModule } from '../../src/features/falabella/falabella.module'
import { FalabellaService } from '../../src/features/falabella/falabella.service'
import { ConfigModule } from '@nestjs/config'
import { FalabellaConfigService } from '../../src/features/falabella/config/falabella-config.service'

describe('FalabellaModule (e2e)', () => {
  let app: INestApplication

  beforeEach(async () => {
    // We create a testing module that ONLY imports the FalabellaModule
    // This ensures it is self-contained and our local config logic works
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          // mocked env vars for testing
          load: [
            () => ({
              FALABELLA_USER_ID: 'test@example.com',
              FALABELLA_API_KEY: 'test-api-key',
            }),
          ],
          isGlobal: true, // ConfigModule is usually global
        }),
        FalabellaModule,
      ],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('should resolve FalabellaService', () => {
    const service = app.get(FalabellaService)
    expect(service).toBeDefined()
  })

  it('should be configured enabled with mock envs', () => {
    const configService = app.get(FalabellaConfigService)
    expect(configService.isConfigured()).toBe(true)
    expect(configService.userId).toBe('test@example.com')
  })

  it('should generate a signature', () => {
    const service = app.get(FalabellaService)
    const signature = service.signRequest({
      Action: 'GetBrands',
      Timestamp: '2023-01-01T00:00:00Z',
    })

    // We don't check the exact hash here as it depends on exact impl details
    // but we check it returns a string
    expect(typeof signature).toBe('string')
    expect(signature.length).toBeGreaterThan(0)
  })
})
