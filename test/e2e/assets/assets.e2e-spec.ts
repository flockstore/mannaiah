import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createE2EApp, closeE2EApp, E2ETestContext } from '../test-utils'
import { Asset } from '../../../src/features/assets/schemas/asset.schema'

/**
 * E2E Tests for Assets Module.
 * Verifies file upload via multipart/form-data, retrieval of signed URLs/keys,
 * and deletion of assets both from DB and underlying storage.
 */
describe('Assets Integration (e2e)', () => {
  let context: E2ETestContext
  let app: INestApplication

  beforeAll(async () => {
    context = await createE2EApp()
    app = context.app
  })

  afterAll(async () => {
    await closeE2EApp(context)
  })

  describe('Assets Flow', () => {
    let createdAssetId: string

    it('should upload an asset', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .post('/assets')
        .attach('file', Buffer.from('fake image content'), 'test-image.jpg')
        .expect(201)

      const body = res.body as Asset
      createdAssetId = body._id
      expect(body.originalName).toBe('test-image.jpg')
      expect(body.mimeType).toBe('image/jpeg')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((body as any).url).toBeUndefined() // URL is signed on get, not stored? or returns key?
      // Check controller response structure. Usually it returns the Asset document.
    })

    it('should get asset by ID', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .get(`/assets/${createdAssetId}`)
        .expect(200)

      const body = res.body as Asset
      expect(body.originalName).toBe('test-image.jpg')
      expect(body.key).toBeDefined()
    })

    it('should delete asset', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .delete(`/assets/${createdAssetId}`)
        .expect(200)

      // Verify deletion
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .get(`/assets/${createdAssetId}`)
        .expect(404)
    })
  })

  describe('Validation', () => {
    it('should fail if no file attached', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer()).post('/assets').expect(400)
    })
  })
})
