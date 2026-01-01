/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing'
import { MongooseModule, getModelToken } from '@nestjs/mongoose'
import { Model, Schema } from 'mongoose'
import { lastValueFrom } from 'rxjs'
import { BaseRepository } from './base.repository'
import { BaseDocument } from '../schemas/base.schema'
import { softDeletePlugin } from '../plugins/soft-delete.plugin'
import { timestampPlugin } from '../plugins/timestamp.plugin'
import {
  createTestMongooseModule,
  stopMongoMemoryServer,
} from '../testing/mongo-test.module'
import { clearCollection } from '../testing/test-helpers'

// Test document interface
interface TestDocument extends BaseDocument {
  name: string
  value: number
}

// Test schema
const TestSchema = new Schema<TestDocument>({
  name: { type: String, required: true },
  value: { type: Number, required: true },
})

TestSchema.plugin(softDeletePlugin)
TestSchema.plugin(timestampPlugin)

const TestModel = 'TestModel'

describe('BaseRepository', () => {
  let repository: BaseRepository<TestDocument>
  let model: Model<TestDocument>
  let module: TestingModule

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        createTestMongooseModule(),
        MongooseModule.forFeature([{ name: TestModel, schema: TestSchema }]),
      ],
    }).compile()

    model = module.get<Model<TestDocument>>(getModelToken(TestModel))
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    repository = new BaseRepository(model)
  })

  afterAll(async () => {
    await module.close()
    await stopMongoMemoryServer()
  })

  afterEach(async () => {
    await clearCollection(model)
  })

  describe('create', () => {
    it('should create a new document', async () => {
      const doc = await lastValueFrom(
        repository.create({ name: 'Test', value: 42 }),
      )

      expect(doc).toBeDefined()
      expect(doc.name).toBe('Test')
      expect(doc.value).toBe(42)
      expect(doc.isDeleted).toBe(false)
      expect(doc.deletedAt).toBeNull()
      expect(doc.createdAt).toBeDefined()
      expect(doc.updatedAt).toBeDefined()
    })

    it('should ignore isDeleted in create payload', async () => {
      const doc = await lastValueFrom(
        repository.create({
          name: 'Test',
          value: 42,
          isDeleted: true,
        } as any),
      )

      expect(doc).toBeDefined()
      expect(doc.name).toBe('Test')
      expect(doc.value).toBe(42)
      expect(doc.isDeleted).toBe(false)
      expect(doc.deletedAt).toBeNull()
    })
  })

  describe('findById', () => {
    it('should find a document by ID', async () => {
      const created = await lastValueFrom(
        repository.create({ name: 'Test', value: 42 }),
      )
      const found = await lastValueFrom(repository.findById(created._id))

      expect(found).toBeDefined()
      expect(found?._id.toString()).toBe(created._id.toString())
      expect(found?.name).toBe('Test')
    })

    it('should return null for non-existent ID', async () => {
      const found = await lastValueFrom(
        repository.findById('507f1f77bcf86cd799439011'),
      )
      expect(found).toBeNull()
    })

    it('should not find soft-deleted document by default', async () => {
      const created = await lastValueFrom(
        repository.create({ name: 'Test', value: 42 }),
      )
      await lastValueFrom(repository.softDelete(created._id))

      const found = await lastValueFrom(repository.findById(created._id))
      expect(found).toBeNull()
    })

    it('should find soft-deleted document with withDeleted option', async () => {
      const created = await lastValueFrom(
        repository.create({ name: 'Test', value: 42 }),
      )
      await lastValueFrom(repository.softDelete(created._id))

      const found = await lastValueFrom(
        repository.findById(created._id, {
          withDeleted: true,
        }),
      )

      expect(found).toBeDefined()
      expect(found?.isDeleted).toBe(true)
    })
  })

  describe('findOne', () => {
    it('should find a document by filter', async () => {
      await lastValueFrom(repository.create({ name: 'Test1', value: 1 }))
      await lastValueFrom(repository.create({ name: 'Test2', value: 2 }))

      const found = await lastValueFrom(repository.findOne({ name: 'Test2' }))

      expect(found).toBeDefined()
      expect(found?.name).toBe('Test2')
      expect(found?.value).toBe(2)
    })

    it('should not find soft-deleted documents by default', async () => {
      const created = await lastValueFrom(
        repository.create({ name: 'Test', value: 42 }),
      )
      await lastValueFrom(repository.softDelete(created._id))

      const found = await lastValueFrom(repository.findOne({ name: 'Test' }))
      expect(found).toBeNull()
    })
  })

  describe('findAll', () => {
    it('should find all documents', async () => {
      await lastValueFrom(repository.create({ name: 'Test1', value: 1 }))
      await lastValueFrom(repository.create({ name: 'Test2', value: 2 }))
      await lastValueFrom(repository.create({ name: 'Test3', value: 3 }))

      const all = await lastValueFrom(repository.findAll())

      expect(all).toHaveLength(3)
    })

    it('should find documents by filter', async () => {
      await lastValueFrom(repository.create({ name: 'Test1', value: 1 }))
      await lastValueFrom(repository.create({ name: 'Test2', value: 2 }))
      await lastValueFrom(repository.create({ name: 'Test1', value: 3 }))

      const filtered = await lastValueFrom(
        repository.findAll({ name: 'Test1' }),
      )

      expect(filtered).toHaveLength(2)
    })

    it('should exclude soft-deleted documents by default', async () => {
      await lastValueFrom(repository.create({ name: 'Test1', value: 1 }))
      const toDelete = await lastValueFrom(
        repository.create({ name: 'Test2', value: 2 }),
      )
      await lastValueFrom(repository.create({ name: 'Test3', value: 3 }))

      await lastValueFrom(repository.softDelete(toDelete._id))

      const all = await lastValueFrom(repository.findAll())
      expect(all).toHaveLength(2)
    })

    it('should include soft-deleted documents with withDeleted option', async () => {
      await lastValueFrom(repository.create({ name: 'Test1', value: 1 }))
      const toDelete = await lastValueFrom(
        repository.create({ name: 'Test2', value: 2 }),
      )
      await lastValueFrom(repository.create({ name: 'Test3', value: 3 }))

      await lastValueFrom(repository.softDelete(toDelete._id))

      const all = await lastValueFrom(
        repository.findAll({}, { withDeleted: true }),
      )
      expect(all).toHaveLength(3)
    })
  })

  describe('update', () => {
    it('should update a document', async () => {
      const created = await lastValueFrom(
        repository.create({ name: 'Test', value: 42 }),
      )

      const updated = await lastValueFrom(
        repository.update(created._id, { value: 99 }),
      )

      expect(updated).toBeDefined()
      expect(updated?._id.toString()).toBe(created._id.toString())
      expect(updated?.value).toBe(99)
      expect(updated?.name).toBe('Test')
    })

    it('should not update soft-deleted documents by default', async () => {
      const created = await lastValueFrom(
        repository.create({ name: 'Test', value: 42 }),
      )
      await lastValueFrom(repository.softDelete(created._id))

      const updated = await lastValueFrom(
        repository.update(created._id, { value: 99 }),
      )

      expect(updated).toBeNull()
    })

    it('should update updatedAt timestamp', async () => {
      const created = await lastValueFrom(
        repository.create({ name: 'Test', value: 42 }),
      )
      const originalUpdatedAt = created.updatedAt

      // Wait a bit to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10))

      const updated = await lastValueFrom(
        repository.update(created._id, { value: 99 }),
      )

      expect(updated?.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      )
    })

    it('should ignore isDeleted in update payload', async () => {
      const created = await lastValueFrom(
        repository.create({ name: 'Test', value: 42 }),
      )

      // Try to manually set isDeleted to true via update
      const updated = await lastValueFrom(
        repository.update(created._id, {
          value: 99,
          isDeleted: true,
        } as any),
      )

      expect(updated).toBeDefined()
      expect(updated?.value).toBe(99)
      expect(updated?.isDeleted).toBe(false)

      // Verify it's still not deleted in DB
      const found = await lastValueFrom(repository.findById(created._id))
      expect(found).toBeDefined()
      expect(found?.isDeleted).toBe(false)
    })
  })

  describe('softDelete', () => {
    it('should soft delete a document', async () => {
      const created = await lastValueFrom(
        repository.create({ name: 'Test', value: 42 }),
      )

      const deleted = await lastValueFrom(repository.softDelete(created._id))

      expect(deleted).toBeDefined()
      expect(deleted?.isDeleted).toBe(true)
      expect(deleted?.deletedAt).toBeDefined()
      expect(deleted?.deletedAt).toBeInstanceOf(Date)

      // Should not find in normal query
      const found = await lastValueFrom(repository.findById(created._id))
      expect(found).toBeNull()
    })

    it('should return null for non-existent document', async () => {
      const deleted = await lastValueFrom(
        repository.softDelete('507f1f77bcf86cd799439011'),
      )
      expect(deleted).toBeNull()
    })
  })

  describe('restore', () => {
    it('should restore a soft-deleted document', async () => {
      const created = await lastValueFrom(
        repository.create({ name: 'Test', value: 42 }),
      )
      await lastValueFrom(repository.softDelete(created._id))

      const restored = await lastValueFrom(repository.restore(created._id))

      expect(restored).toBeDefined()
      expect(restored?.isDeleted).toBe(false)
      expect(restored?.deletedAt).toBeNull()

      // Should find in normal query
      const found = await lastValueFrom(repository.findById(created._id))
      expect(found).toBeDefined()
    })

    it('should return null for non-existent document', async () => {
      const restored = await lastValueFrom(
        repository.restore('507f1f77bcf86cd799439011'),
      )
      expect(restored).toBeNull()
    })
  })

  describe('hardDelete', () => {
    it('should permanently delete a document', async () => {
      const created = await lastValueFrom(
        repository.create({ name: 'Test', value: 42 }),
      )

      const deleted = await lastValueFrom(repository.hardDelete(created._id))

      expect(deleted).toBeDefined()

      // Should not find even with withDeleted option
      const found = await lastValueFrom(
        repository.findById(created._id, {
          withDeleted: true,
        }),
      )
      expect(found).toBeNull()
    })
  })

  describe('count', () => {
    it('should count all documents', async () => {
      await lastValueFrom(repository.create({ name: 'Test1', value: 1 }))
      await lastValueFrom(repository.create({ name: 'Test2', value: 2 }))
      await lastValueFrom(repository.create({ name: 'Test3', value: 3 }))

      const count = await lastValueFrom(repository.count())
      expect(count).toBe(3)
    })

    it('should count documents by filter', async () => {
      await lastValueFrom(repository.create({ name: 'Test1', value: 1 }))
      await lastValueFrom(repository.create({ name: 'Test2', value: 2 }))
      await lastValueFrom(repository.create({ name: 'Test1', value: 3 }))

      const count = await lastValueFrom(repository.count({ name: 'Test1' }))
      expect(count).toBe(2)
    })

    it('should exclude soft-deleted documents by default', async () => {
      await lastValueFrom(repository.create({ name: 'Test1', value: 1 }))
      const toDelete = await lastValueFrom(
        repository.create({ name: 'Test2', value: 2 }),
      )
      await lastValueFrom(repository.create({ name: 'Test3', value: 3 }))

      await lastValueFrom(repository.softDelete(toDelete._id))

      const count = await lastValueFrom(repository.count())
      expect(count).toBe(2)
    })

    it('should include soft-deleted documents with withDeleted option', async () => {
      await lastValueFrom(repository.create({ name: 'Test1', value: 1 }))
      const toDelete = await lastValueFrom(
        repository.create({ name: 'Test2', value: 2 }),
      )
      await lastValueFrom(repository.create({ name: 'Test3', value: 3 }))

      await lastValueFrom(repository.softDelete(toDelete._id))

      const count = await lastValueFrom(
        repository.count({}, { withDeleted: true }),
      )
      expect(count).toBe(3)
    })
  })

  describe('exists', () => {
    it('should return true when document exists', async () => {
      await lastValueFrom(repository.create({ name: 'Test', value: 42 }))

      const exists = await lastValueFrom(repository.exists({ name: 'Test' }))
      expect(exists).toBe(true)
    })

    it('should return false when document does not exist', async () => {
      const exists = await lastValueFrom(
        repository.exists({ name: 'NonExistent' }),
      )
      expect(exists).toBe(false)
    })

    it('should return false for soft-deleted documents by default', async () => {
      const created = await lastValueFrom(
        repository.create({ name: 'Test', value: 42 }),
      )
      await lastValueFrom(repository.softDelete(created._id))

      const exists = await lastValueFrom(repository.exists({ name: 'Test' }))
      expect(exists).toBe(false)
    })
  })

  describe('findAllPaginated', () => {
    beforeEach(async () => {
      // Create test documents
      await lastValueFrom(repository.create({ name: 'Test1', value: 1 }))
      await lastValueFrom(repository.create({ name: 'Test2', value: 2 }))
      await lastValueFrom(repository.create({ name: 'Test3', value: 3 }))
      await lastValueFrom(repository.create({ name: 'Test4', value: 4 }))
      await lastValueFrom(repository.create({ name: 'Test5', value: 5 }))
    })

    it('should return paginated results with correct metadata', async () => {
      const result = await lastValueFrom(repository.findAllPaginated({}, 1, 2))

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(5)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(2)
    })

    it('should return correct page of results', async () => {
      const page1 = await lastValueFrom(repository.findAllPaginated({}, 1, 2))
      const page2 = await lastValueFrom(repository.findAllPaginated({}, 2, 2))

      expect(page1.data).toHaveLength(2)
      expect(page2.data).toHaveLength(2)
      expect(page1.total).toBe(5)
      expect(page2.total).toBe(5)
      // Ensure different documents on different pages
      expect(page1.data[0]._id.toString()).not.toBe(
        page2.data[0]._id.toString(),
      )
    })

    it('should respect filter query', async () => {
      const result = await lastValueFrom(
        repository.findAllPaginated({ name: 'Test1' }, 1, 10),
      )

      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.data[0].name).toBe('Test1')
    })

    it('should exclude soft-deleted documents by default', async () => {
      const docs = await lastValueFrom(repository.findAll())
      await lastValueFrom(repository.softDelete(docs[0]._id))

      const result = await lastValueFrom(repository.findAllPaginated({}, 1, 10))

      expect(result.data).toHaveLength(4)
      expect(result.total).toBe(4)
    })

    it('should include soft-deleted documents when withDeleted option is true', async () => {
      const docs = await lastValueFrom(repository.findAll())
      await lastValueFrom(repository.softDelete(docs[0]._id))

      const result = await lastValueFrom(
        repository.findAllPaginated({}, 1, 10, { withDeleted: true }),
      )

      expect(result.data).toHaveLength(5)
      expect(result.total).toBe(5)
    })

    it('should use default page and limit values', async () => {
      const result = await lastValueFrom(repository.findAllPaginated())

      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
      expect(result.data).toHaveLength(5) // All 5 test documents
    })

    it('should handle empty result set', async () => {
      await clearCollection(model)

      const result = await lastValueFrom(repository.findAllPaginated({}, 1, 10))

      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
    })

    it('should exclude items by ID when excludeIds is provided', async () => {
      const allDocs = await lastValueFrom(repository.findAll())
      const idsToExclude = [
        allDocs[0]._id.toString(),
        allDocs[1]._id.toString(),
      ]
      const result = await lastValueFrom(
        repository.findAllPaginated(
          {},
          1,
          10,
          undefined,
          undefined,
          idsToExclude,
        ),
      )
      expect(result.data).toHaveLength(3)
      expect(result.total).toBe(3)
      result.data.forEach((doc) => {
        expect(idsToExclude).not.toContain(doc._id.toString())
      })
    })

    it('should extract excludeIds from filter if provided there', async () => {
      const allDocs = await lastValueFrom(repository.findAll())
      const idsToExclude = [
        allDocs[0]._id.toString(),
        allDocs[1]._id.toString(),
      ]

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const filterWithExclude = {
        excludeIds: idsToExclude,
      } as any

      const result = await lastValueFrom(
        repository.findAllPaginated(filterWithExclude, 1, 10),
      )

      expect(result.data).toHaveLength(3)
      expect(result.total).toBe(3)
      result.data.forEach((doc) => {
        expect(idsToExclude).not.toContain(doc._id.toString())
      })
    })

    it('should sort results correctly when sort is provided in filter', async () => {
      // Ensure values are unique for sorting test: 1, 2, 3, 4, 5
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const filterWithSort = {
        sort: { value: -1 },
      } as any

      const result = await lastValueFrom(
        repository.findAllPaginated(filterWithSort, 1, 10),
      )

      expect(result.data[0].value).toBe(5)
      expect(result.data[result.data.length - 1].value).toBe(1)
    })
  })
})
