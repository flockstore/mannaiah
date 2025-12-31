import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { getModelToken } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  DocumentType,
  ContactDocument,
} from '../../../src/features/contacts/interfaces/contact.interface'
import { createE2EApp, closeE2EApp, E2ETestContext } from '../test-utils'

/**
 * E2E Tests for Contacts Module.
 * Covers CRUD operations, unique constraints (document number), and soft delete logic.
 * Also validates proper error handling for invalid input and duplicates.
 */
describe('Contacts Integration (e2e)', () => {
  let context: E2ETestContext
  let app: INestApplication

  beforeAll(async () => {
    context = await createE2EApp()
    app = context.app

    // Ensure indexes are built for unique constraints

    const contactModel = app.get<Model<any>>(getModelToken('Contact'))
    await contactModel.ensureIndexes()
  })

  afterAll(async () => {
    await closeE2EApp(context)
  })

  describe('Contacts Flow', () => {
    let createdContactId: string

    it('should create a contact', async () => {
      const dto = {
        legalName: 'Acme Corp',
        documentType: DocumentType.NIT,
        documentNumber: '12345678901',
        email: 'contact@acme.com',
        phone: '123456789',
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .post('/contacts')
        .send(dto)
        .expect(201)

      const body = res.body as ContactDocument
      createdContactId = String(body._id)
      expect(body.legalName).toBe(dto.legalName)
    })

    it('should get contact by ID', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .get(`/contacts/${createdContactId}`)
        .expect(200)

      const body = res.body as ContactDocument
      expect(body.legalName).toBe('Acme Corp')
    })

    it('should update contact', async () => {
      const updateDto = {
        email: 'new@acme.com',
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .patch(`/contacts/${createdContactId}`)
        .send(updateDto)
        .expect(200)

      const body = res.body as ContactDocument
      expect(body.email).toBe(updateDto.email)
    })

    it('should soft delete contact', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .delete(`/contacts/${createdContactId}`)
        .expect(200)

      // Verify it is not found (assuming default findAll filters deleted, or getById handles it)
      // But wait, the controller might return 404 or just the deleted object depending on implementation.
      // Let's check service logic: softDelete likely returns the deleted doc.
      // But subsequent get should fail or show isDeleted=true if logic dictates.

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .get(`/contacts/${createdContactId}`)
        .expect(404) // Expect 404 Not Found since it's soft deleted

      // Verify body message or similar (optional)
    })
  })

  describe('Validation & Edge Cases', () => {
    it('should fail if both legalName and personal names are provided', async () => {
      const dto = {
        legalName: 'Acme Corp',
        firstName: 'John',
        lastName: 'Doe',
        documentType: DocumentType.NIT,
        documentNumber: '999999',
        email: 'bad@test.com',
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer()).post('/contacts').send(dto).expect(400)
    })

    it('should fail if duplicate document number', async () => {
      // Create one
      const dto = {
        legalName: 'Duplicate Corp',
        documentType: DocumentType.NIT,
        documentNumber: '888888',
        email: 'dup1@test.com',
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer()).post('/contacts').send(dto).expect(201)

      // Try create another
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await request(app.getHttpServer())
        .post('/contacts')
        .send({ ...dto, email: 'dup2@test.com' })
        .expect(409)
    })
  })

  describe('Pagination Features', () => {
    let id1: string, id2: string, id3: string

    beforeAll(async () => {
      // Create test data
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const c1 = await request(app.getHttpServer()).post('/contacts').send({
        legalName: 'A Company',
        documentType: DocumentType.NIT,
        documentNumber: '111',
        email: 'a@test.com',
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      id1 = c1.body._id as string

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const c2 = await request(app.getHttpServer()).post('/contacts').send({
        legalName: 'B Company',
        documentType: DocumentType.NIT,
        documentNumber: '222',
        email: 'b@test.com',
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      id2 = c2.body._id as string

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const c3 = await request(app.getHttpServer()).post('/contacts').send({
        legalName: 'C Company',
        documentType: DocumentType.NIT,
        documentNumber: '333',
        email: 'c@test.com',
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      id3 = c3.body._id as string
    })

    it('should exclude specific IDs', async () => {
      // Exclude id2
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .get(`/contacts?excludeIds=${id2}`)
        .expect(200)

      const body = res.body as { data: ContactDocument[]; total: number }
      // Should find id1 and id3, but not id2
      const ids = body.data.map((c) => c._id)
      expect(ids).toContain(id1)
      expect(ids).toContain(id3)
      expect(ids).not.toContain(id2)
    })

    it('should sort by legalName ascending', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .get('/contacts?orderBy=legalName&orderDir=asc&limit=100') // limit high enough to get all
        .expect(200)

      const body = res.body as { data: ContactDocument[] }
      const names = body.data.map((c) => c.legalName).filter(Boolean)
      // We expect at least A, B, C companies in order among others
      const aIndex = names.indexOf('A Company')
      const bIndex = names.indexOf('B Company')
      const cIndex = names.indexOf('C Company')

      expect(aIndex).toBeGreaterThan(-1)
      expect(bIndex).toBeGreaterThan(aIndex)
      expect(cIndex).toBeGreaterThan(bIndex)
    })

    it('should sort by legalName descending', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const res = await request(app.getHttpServer())
        .get('/contacts?orderBy=legalName&orderDir=desc&limit=100')
        .expect(200)

      const body = res.body as { data: ContactDocument[] }
      const names = body.data.map((c) => c.legalName).filter(Boolean)

      const aIndex = names.indexOf('A Company')
      const bIndex = names.indexOf('B Company')
      const cIndex = names.indexOf('C Company')

      expect(cIndex).toBeGreaterThan(-1)
      expect(bIndex).toBeGreaterThan(cIndex)
      expect(aIndex).toBeGreaterThan(bIndex)
    })
  })
})
