/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import { Schema, model, Model } from 'mongoose'
import { softDeletePlugin } from './soft-delete.plugin'
import { timestampPlugin } from './timestamp.plugin'
import {
  startMongoMemoryServer,
  stopMongoMemoryServer,
} from '../testing/mongo-test.module'
import * as mongoose from 'mongoose'
import { SoftDeleteMethods } from '../schemas/base.schema'

// Test document interface
interface TestDoc extends SoftDeleteMethods {
  name: string
  value: number
  isDeleted: boolean
  deletedAt: Date | null
}

describe('SoftDeletePlugin', () => {
  let connection: typeof mongoose
  let TestModel: Model<TestDoc>

  beforeAll(async () => {
    const uri = await startMongoMemoryServer()
    connection = await mongoose.connect(uri)

    const schema = new Schema<TestDoc>({
      name: { type: String, required: true },
      value: { type: Number, required: true },
    })

    schema.plugin(softDeletePlugin)
    schema.plugin(timestampPlugin)

    TestModel = model<TestDoc>('SoftDeleteTest', schema)
  })

  afterAll(async () => {
    await connection.disconnect()
    await stopMongoMemoryServer()
  })

  afterEach(async () => {
    await TestModel.deleteMany({}).setOptions({ withDeleted: true })
  })

  describe('schema fields', () => {
    it('should add isDeleted and deletedAt fields', async () => {
      const doc = new TestModel({ name: 'Test', value: 42 })
      await doc.save()

      expect(doc.isDeleted).toBe(false)
      expect(doc.deletedAt).toBeNull()
    })
  })

  describe('softDelete method', () => {
    it('should soft delete a document', async () => {
      const doc = new TestModel({ name: 'Test', value: 42 })
      await doc.save()

      await doc.softDelete()

      expect(doc.isDeleted).toBe(true)
      expect(doc.deletedAt).toBeDefined()
      expect(doc.deletedAt).toBeInstanceOf(Date)
    })
  })

  describe('restore method', () => {
    it('should restore a soft-deleted document', async () => {
      const doc = new TestModel({ name: 'Test', value: 42 })
      await doc.save()

      await doc.softDelete()
      expect(doc.isDeleted).toBe(true)

      await doc.restore()
      expect(doc.isDeleted).toBe(false)
      expect(doc.deletedAt).toBeNull()
    })
  })

  describe('query middleware', () => {
    it('should exclude soft-deleted documents from find', async () => {
      await TestModel.create({ name: 'Test1', value: 1 })
      const doc2 = await TestModel.create({ name: 'Test2', value: 2 })
      await TestModel.create({ name: 'Test3', value: 3 })

      await doc2.softDelete()

      const results = await TestModel.find()
      expect(results).toHaveLength(2)
      expect(results.map((r) => r.name)).toEqual(['Test1', 'Test3'])
    })

    it('should exclude soft-deleted documents from findOne', async () => {
      const doc = await TestModel.create({ name: 'Test', value: 42 })
      await doc.softDelete()

      const found = await TestModel.findOne({ name: 'Test' })
      expect(found).toBeNull()
    })

    it('should exclude soft-deleted documents from count', async () => {
      await TestModel.create({ name: 'Test1', value: 1 })
      const doc2 = await TestModel.create({ name: 'Test2', value: 2 })
      await TestModel.create({ name: 'Test3', value: 3 })

      await doc2.softDelete()

      const count = await TestModel.countDocuments()
      expect(count).toBe(2)
    })
  })

  describe('withDeleted option', () => {
    it('should include soft-deleted documents with withDeleted option in find', async () => {
      await TestModel.create({ name: 'Test1', value: 1 })
      const doc2 = await TestModel.create({ name: 'Test2', value: 2 })
      await TestModel.create({ name: 'Test3', value: 3 })

      await doc2.softDelete()

      const results = await TestModel.find().setOptions({ withDeleted: true })
      expect(results).toHaveLength(3)
    })

    it('should include soft-deleted documents with withDeleted option in findOne', async () => {
      const doc = await TestModel.create({ name: 'Test', value: 42 })
      await doc.softDelete()

      const found = await TestModel.findOne({ name: 'Test' }).setOptions({
        withDeleted: true,
      })
      expect(found).toBeDefined()
      expect(found?.isDeleted).toBe(true)
    })

    it('should include soft-deleted documents with withDeleted option in count', async () => {
      await TestModel.create({ name: 'Test1', value: 1 })
      const doc2 = await TestModel.create({ name: 'Test2', value: 2 })
      await TestModel.create({ name: 'Test3', value: 3 })

      await doc2.softDelete()

      const count = await TestModel.countDocuments().setOptions({
        withDeleted: true,
      })
      expect(count).toBe(3)
    })
  })

  describe('static methods', () => {
    it('should provide findWithDeleted static method', async () => {
      await TestModel.create({ name: 'Test1', value: 1 })
      const doc2 = await TestModel.create({ name: 'Test2', value: 2 })
      await TestModel.create({ name: 'Test3', value: 3 })

      await doc2.softDelete()

      const results = await (TestModel as any).findWithDeleted()
      expect(results).toHaveLength(3)
    })

    it('should provide findOneWithDeleted static method', async () => {
      const doc = await TestModel.create({ name: 'Test', value: 42 })
      await doc.softDelete()

      const found = await (TestModel as any).findOneWithDeleted({
        name: 'Test',
      })
      expect(found).toBeDefined()
      expect(found.isDeleted).toBe(true)
    })
  })

  describe('update operations', () => {
    it('should not update soft-deleted documents by default', async () => {
      const doc = await TestModel.create({ name: 'Test', value: 42 })
      await doc.softDelete()

      const updated = await TestModel.findOneAndUpdate(
        { name: 'Test' },
        { value: 99 },
        { new: true },
      )

      expect(updated).toBeNull()
    })

    it('should update soft-deleted documents with withDeleted option', async () => {
      const doc = await TestModel.create({ name: 'Test', value: 42 })
      await doc.softDelete()

      const updated = await TestModel.findOneAndUpdate(
        { name: 'Test' },
        { value: 99 },
        { new: true },
      ).setOptions({ withDeleted: true })

      expect(updated).toBeDefined()
      expect(updated?.value).toBe(99)
    })
  })
})
