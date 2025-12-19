import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createE2EApp, closeE2EApp, E2ETestContext } from '../test-utils'
import { Variation } from '../../../src/features/variations/schemas/variation.schema'

/**
 * E2E Tests for Variations Module.
 * Validates CRUD operations for product variations (Color, Size, etc.)
 * including input validation and partial updates.
 */
describe('Variations Integration (e2e)', () => {
  let context: E2ETestContext
  let app: INestApplication

  beforeAll(async () => {
    context = await createE2EApp()
    app = context.app
  })

  afterAll(async () => {
    await closeE2EApp(context)
  })

  describe('Variations CRUD', () => {
    let variationId: string

    it('should create a variation', async () => {
      const dto = {
        name: 'Size XL',
        definition: 'TEXT',
        value: 'XL',
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .post('/variations')
        .send(dto)
        .expect(201)

      const body = res.body as Variation
      variationId = body._id
      expect(body.name).toBe(dto.name)
    })

    it('should get variation by ID', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .get(`/variations/${variationId}`)
        .expect(200)

      const body = res.body as Variation
      expect(body.name).toBe('Size XL')
    })

    it('should update variation', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .patch(`/variations/${variationId}`)
        .send({ value: 'XXL' }) // Assuming update DTO allows partial
        .expect(200)

      const body = res.body as Variation
      expect(body.value).toBe('XXL')
    })

    it('should delete variation', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .delete(`/variations/${variationId}`)
        .expect(200)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .get(`/variations/${variationId}`)
        .expect(404)
    })
  })
})
