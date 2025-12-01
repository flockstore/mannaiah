import { Test, TestingModule } from '@nestjs/testing'
import { MongooseModule } from '@nestjs/mongoose'
import { lastValueFrom } from 'rxjs'
import { ContactsModule } from './contacts.module'
import { ContactService } from './services/contact.service'
import {
  ContactCreate,
  DocumentType, // DocumentType is still used in tests, so it must remain imported.
  ContactUpdate,
} from './interfaces/contact.interface'
import {
  createTestMongooseModule,
  stopMongoMemoryServer,
} from '../../core/mongo/testing/mongo-test.module'
import { ContactRepository } from './repositories/contact.repository'
import { JwtStrategy } from '../../auth/jwt.strategy'

// Set env vars before any modules are imported/initialized
process.env.LOGTO_ISSUER = 'https://test.logto.app'
process.env.LOGTO_AUDIENCE = 'https://api.test.com'

describe('ContactService (Integration)', () => {
  let service: ContactService
  let module: TestingModule

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [createTestMongooseModule(), ContactsModule],
    })
      .overrideProvider(JwtStrategy)
      .useValue({})
      .compile()

    service = module.get<ContactService>(ContactService)
  })

  afterAll(async () => {
    await module.close()
    await stopMongoMemoryServer()
  })

  afterEach(async () => {
    // Clean up database after each test
    const repository = module.get<ContactRepository>(ContactRepository)
    // We can't use deleteMany directly on repository as it's not exposed,
    // but we can use the model directly if we wanted, or just rely on repository methods.
    // However, BaseRepository doesn't have clearCollection.
    // Let's use the model from the repository.
    await repository['model'].deleteMany({}).exec()
  })

  describe('createContact', () => {
    it('should create a contact with legal name', async () => {
      const dto: ContactCreate = {
        legalName: 'Acme Corp',
        documentType: DocumentType.NIT,
        documentNumber: '12345678901',
        email: 'contact@acme.com',
        phone: '123456789',
      }

      const contact = await lastValueFrom(service.createContact(dto))

      expect(contact).toBeDefined()
      expect(contact.legalName).toBe(dto.legalName)
      expect(contact.documentType).toBe(dto.documentType)
      expect(contact.documentNumber).toBe(dto.documentNumber)
      expect(contact.isDeleted).toBe(false)
    })

    it('should sanitize phone number on creation', async () => {
      const dto: ContactCreate = {
        legalName: 'Acme Corp',
        documentType: DocumentType.NIT,
        documentNumber: '12345678901',
        email: 'contact@acme.com',
        phone: '+1 234 567',
      }

      const contact = await lastValueFrom(service.createContact(dto))

      expect(contact.phone).toBe('1234567')
    })

    it('should create a contact with personal names', async () => {
      const dto: ContactCreate = {
        firstName: 'John',
        lastName: 'Doe',
        documentType: DocumentType.CC,
        documentNumber: '87654321',
        email: 'john@doe.com',
      }

      const contact = await lastValueFrom(service.createContact(dto))

      expect(contact).toBeDefined()
      expect(contact.firstName).toBe(dto.firstName)
      expect(contact.lastName).toBe(dto.lastName)
      expect(contact.legalName).toBeUndefined()
    })

    it('should fail if both legalName and personal names are provided', async () => {
      const dto: ContactCreate = {
        legalName: 'Acme Corp',
        firstName: 'John',
        documentType: DocumentType.NIT,
        documentNumber: '12345678901',
        email: 'test@test.com',
      }

      await expect(lastValueFrom(service.createContact(dto))).rejects.toThrow(
        'Cannot have both legalName and personal names',
      )
    })

    it('should fail if neither legalName nor full personal names are provided', async () => {
      const dto: ContactCreate = {
        firstName: 'John',
        // Missing lastName
        documentType: DocumentType.CC,
        documentNumber: '12345678',
        email: 'test@test.com',
      }

      await expect(lastValueFrom(service.createContact(dto))).rejects.toThrow(
        'Must provide either legalName OR both firstName and lastName',
      )
    })

    it('should fail if duplicate document number', async () => {
      const dto: ContactCreate = {
        legalName: 'Acme Corp',
        documentType: DocumentType.NIT,
        documentNumber: '12345678901',
        email: 'contact@acme.com',
      }

      await lastValueFrom(service.createContact(dto))

      // Try to create another with same document
      const dto2: ContactCreate = {
        legalName: 'Another Corp',
        documentType: DocumentType.NIT,
        documentNumber: '12345678901',
        email: 'another@acme.com',
      }

      // Usually, a global filter is the best way to handle this for all services.
      // So here in the service test, we still expect an error, but in a real app request it would be 409.
      // Let's verify it throws the MongoError with code 11000.
      try {
        await lastValueFrom(service.createContact(dto2))
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.code).toBe(11000)
      }
    })
  })

  describe('findById', () => {
    it('should find a contact by ID', async () => {
      const dto: ContactCreate = {
        legalName: 'Acme Corp',
        documentType: DocumentType.NIT,
        documentNumber: '12345678901',
        email: 'contact@acme.com',
      }

      const created = await lastValueFrom(service.createContact(dto))
      const found = await lastValueFrom(service.findById(created._id))

      expect(found).toBeDefined()
      expect(found?.legalName).toBe(dto.legalName)
    })

    it('should return null for non-existent ID', async () => {
      const found = await lastValueFrom(
        service.findById('507f1f77bcf86cd799439011'),
      )
      expect(found).toBeNull()
    })
  })

  describe('updateContact', () => {
    it('should update contact fields', async () => {
      const dto: ContactCreate = {
        legalName: 'Acme Corp',
        documentType: DocumentType.NIT,
        documentNumber: '12345678901',
        email: 'contact@acme.com',
      }

      const created = await lastValueFrom(service.createContact(dto))

      const updateDto: ContactUpdate = {
        email: 'new@acme.com',
      }

      const updated = await lastValueFrom(
        service.updateContact(created._id.toString(), updateDto),
      )

      expect(updated).toBeDefined()
      expect(updated?.email).toBe('new@acme.com')
      expect(updated?.legalName).toBe('Acme Corp')
    })

    it('should sanitize phone number on update', async () => {
      const dto: ContactCreate = {
        legalName: 'Acme Corp',
        documentType: DocumentType.NIT,
        documentNumber: '12345678901',
        email: 'contact@acme.com',
      }

      const created = await lastValueFrom(service.createContact(dto))

      const updated = await lastValueFrom(
        service.updateContact(created._id.toString(), {
          phone: '+1 234 567',
        }),
      )

      expect(updated?.phone).toBe('1234567')
    })

    it('should ignore isDeleted in update payload', async () => {
      const dto: ContactCreate = {
        legalName: 'Acme Corp',
        documentType: DocumentType.NIT,
        documentNumber: '12345678901',
        email: 'contact@acme.com',
      }

      const created = await lastValueFrom(service.createContact(dto))

      const updateDto: any = {
        isDeleted: true,
      }

      const updated = await lastValueFrom(
        service.updateContact(created._id.toString(), updateDto),
      )

      expect(updated?.isDeleted).toBe(false)
    })

    it('should validate names on update', async () => {
      const dto: ContactCreate = {
        legalName: 'Acme Corp',
        documentType: DocumentType.NIT,
        documentNumber: '12345678901',
        email: 'contact@acme.com',
      }

      const created = await lastValueFrom(service.createContact(dto))

      // Try to add first name to a legal entity
      const updateDto: ContactUpdate = {
        firstName: 'John',
      }

      await expect(
        lastValueFrom(service.updateContact(created._id.toString(), updateDto)),
      ).rejects.toThrow('Cannot have both legalName and personal names')
    })
  })

  describe('softDelete and restore', () => {
    it('should soft delete a contact', async () => {
      const dto: ContactCreate = {
        legalName: 'Acme Corp',
        documentType: DocumentType.NIT,
        documentNumber: '12345678901',
        email: 'contact@acme.com',
      }

      const created = await lastValueFrom(service.createContact(dto))
      const deleted = await lastValueFrom(service.softDelete(created._id))

      expect(deleted).toBeDefined()
      expect(deleted?.isDeleted).toBe(true)
      expect(deleted?.deletedAt).toBeDefined()

      // Should not be found by default
      const found = await lastValueFrom(service.findById(created._id))
      expect(found).toBeNull()
    })

    it('should restore a contact', async () => {
      const dto: ContactCreate = {
        legalName: 'Acme Corp',
        documentType: DocumentType.NIT,
        documentNumber: '12345678901',
        email: 'contact@acme.com',
      }

      const created = await lastValueFrom(service.createContact(dto))
      await lastValueFrom(service.softDelete(created._id))
      const restored = await lastValueFrom(service.restore(created._id))

      expect(restored).toBeDefined()
      expect(restored?.isDeleted).toBe(false)
      expect(restored?.deletedAt).toBeNull()

      // Should be found again
      const found = await lastValueFrom(service.findById(created._id))
      expect(found).toBeDefined()
    })
  })

  // findByEmail was removed from service, functionality covered by findAllPaginated
  // findByDocument was also removed, use findAllPaginated with query filters instead


  describe('timestamps', () => {
    it('should set createdAt and updatedAt on creation', async () => {
      const contact = await lastValueFrom(
        service.createContact({
          documentType: DocumentType.CC,
          documentNumber: '1234567890',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        }),
      )

      expect(contact.createdAt).toBeDefined()
      expect(contact.updatedAt).toBeDefined()
      expect(contact.createdAt).toEqual(contact.updatedAt)
    })

    it('should update updatedAt on modification', async () => {
      const contact = await lastValueFrom(
        service.createContact({
          documentType: DocumentType.CC,
          documentNumber: '1234567890',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        }),
      )

      const originalUpdatedAt = contact.updatedAt

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10))

      const updated = await lastValueFrom(
        service.updateContact(contact._id.toString(), {
          phone: '9876543210',
        }),
      )

      expect(updated?.updatedAt).not.toEqual(originalUpdatedAt)
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      )
    })
  })
})
