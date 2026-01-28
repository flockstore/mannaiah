import request from 'supertest'
import { ChatwootService } from '../../src/features/chatwoot/chatwoot.service'
import { ChatwootConfigService } from '../../src/features/chatwoot/config/chatwoot-config.service'
import { createE2EApp, closeE2EApp, E2ETestContext } from './test-utils'

describe('Chatwoot (E2E)', () => {
  let context: E2ETestContext

  const chatwootService = {
    syncContact: jest.fn(),
    onModuleInit: jest.fn(),
    verifyCredentials: jest.fn(),
  }

  const configService = {
    isSyncEnabled: true,
    isConfigured: jest.fn().mockReturnValue(true),
    isCronEnabled: true,
    // Mock other getters required during init
    url: 'http://test.com',
    apiKey: 'key',
    accountId: '1',
  }

  beforeAll(async () => {
    context = await createE2EApp((builder) =>
      builder
        .overrideProvider(ChatwootService)
        .useValue(chatwootService)
        .overrideProvider(ChatwootConfigService)
        .useValue(configService),
    )
  })

  afterAll(async () => {
    await closeE2EApp(context)
  })

  it('/chatwoot/sync (POST) should trigger full sync', () => {
    return request(context.app.getHttpServer() as unknown)
      .post('/chatwoot/sync')
      .expect(201)
      .expect((res) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(res.body.message).toContain('Scheduled full contact sync')
      })
  })

  it('/chatwoot/sync?emails=... (POST) should trigger partial sync', () => {
    return request(context.app.getHttpServer() as unknown)
      .post('/chatwoot/sync?emails=test@example.com')
      .expect(201)
      .expect((res) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(res.body.message).toContain('Scheduled sync for 1 contacts')
      })
  })

  it('should return 400 if sync is disabled', async () => {
    configService.isSyncEnabled = false

    await request(context.app.getHttpServer() as unknown)
      .post('/chatwoot/sync')
      .expect(400)

    configService.isSyncEnabled = true
  })
})
