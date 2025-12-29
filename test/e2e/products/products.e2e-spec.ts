import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createE2EApp, closeE2EApp, E2ETestContext } from '../test-utils'
import { Product } from '../../../src/features/products/schemas/product.schema'

/**
 * E2E Tests for Products Module.
 * Verifies the full product creation flow including dependencies (Variations, Assets)
 * and data structure integrity across relationships.
 */
describe('Product Integration (e2e)', () => {
  let context: E2ETestContext
  let app: INestApplication

  beforeAll(async () => {
    context = await createE2EApp()
    app = context.app
  })

  afterAll(async () => {
    await closeE2EApp(context)
  })

  it('should support full product creation flow', async () => {
    // 1. Create Variation
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const variationRes = await request(app.getHttpServer())
      .post('/variations')
      .send({
        name: 'Color Red',
        definition: 'COLOR',
        value: '#FF0000',
      })
      .expect(201)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const variationId = variationRes.body._id as string

    // 2. Upload Asset
    // Supertest attachment
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const assetRes = await request(app.getHttpServer())
      .post('/assets')
      .attach('file', Buffer.from('fake image'), 'test.jpg')
      .expect(201)

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const assetId = assetRes.body._id as string

    // 3. Create Product
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const productRes = await request(app.getHttpServer())
      .post('/products')
      .send({
        sku: 'TEST_SKU_FULL',
        gallery: [
          {
            assetId: assetId,
            isMain: true,
            variationId: variationId,
          },
        ],
        variations: [variationId],
        variants: [
          {
            variationIds: [variationId],
            sku: 'TEST_VARIANT_SKU',
          },
          {
            variationIds: [variationId],
            // Missing SKU, should fallback to TEST_SKU_FULL
          },
        ],
        datasheets: [
          {
            realm: 'default',
            name: 'Test Product',
            description: 'Integration Test Product',
          },
        ],
      })
      .expect(201)

    const body = productRes.body as Product
    expect(body.sku).toBe('TEST_SKU_FULL')
    expect(body.gallery[0].assetId).toBe(assetId)
    expect(body.variations[0]).toBe(variationId)
    expect(body.variants).toHaveLength(2)
    expect(body.variants[0].sku).toBe('TEST_VARIANT_SKU')
    expect(body.variants[1].sku).toBe('TEST_SKU_FULL')
  })
})
