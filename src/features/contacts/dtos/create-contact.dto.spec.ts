import 'reflect-metadata'
import { validate } from 'class-validator'
import { plainToClass } from 'class-transformer'
import { ContactCreate } from './create-contact.dto'
import { DocumentType } from '../interfaces/contact.interface'

describe('ContactCreate', () => {
  describe('Valid DTOs', () => {
    it('should validate a complete DTO with personal names', async () => {
      const dto = plainToClass(ContactCreate, {
        documentType: DocumentType.CC,
        documentNumber: '123456789',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        addressExtra: 'Apt 4B',
        cityCode: '110111',
      })

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should validate a DTO with legal name', async () => {
      const dto = plainToClass(ContactCreate, {
        documentType: DocumentType.NIT,
        documentNumber: '900123456',
        legalName: 'Acme Corporation',
        email: 'contact@acme.com',
      })

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should validate a minimal DTO with personal names', async () => {
      const dto = plainToClass(ContactCreate, {
        documentType: DocumentType.CC,
        documentNumber: '123456789',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      })

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should validate different document types', async () => {
      const documentTypes = [
        DocumentType.CC,
        DocumentType.CE,
        DocumentType.TI,
        DocumentType.PAS,
        DocumentType.NIT,
        DocumentType.OTHER,
      ]

      for (const docType of documentTypes) {
        const dto = plainToClass(ContactCreate, {
          documentType: docType,
          documentNumber: '123456789',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        })

        const errors = await validate(dto)
        expect(errors).toHaveLength(0)
      }
    })
  })

  describe('Invalid DTOs', () => {
    // Document fields are now optional, so no validation errors expected when missing

    it('should fail when email is missing', async () => {
      const dto = plainToClass(ContactCreate, {
        documentType: DocumentType.CC,
        documentNumber: '123456789',
        firstName: 'John',
        lastName: 'Doe',
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      const emailError = errors.find((e) => e.property === 'email')
      expect(emailError).toBeDefined()
    })

    it('should fail when email is invalid', async () => {
      const dto = plainToClass(ContactCreate, {
        documentType: DocumentType.CC,
        documentNumber: '123456789',
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      const emailError = errors.find((e) => e.property === 'email')
      expect(emailError).toBeDefined()
    })

    it('should fail when only firstName is provided without lastName', async () => {
      const dto = plainToClass(ContactCreate, {
        documentType: DocumentType.CC,
        documentNumber: '123456789',
        firstName: 'John',
        email: 'john@example.com',
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      const lastNameError = errors.find((e) => e.property === 'lastName')
      expect(lastNameError).toBeDefined()
    })

    it('should fail when only lastName is provided without firstName', async () => {
      const dto = plainToClass(ContactCreate, {
        documentType: DocumentType.CC,
        documentNumber: '123456789',
        lastName: 'Doe',
        email: 'doe@example.com',
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      const firstNameError = errors.find((e) => e.property === 'firstName')
      expect(firstNameError).toBeDefined()
    })

    it('should fail when neither legalName nor personal names are provided', async () => {
      const dto = plainToClass(ContactCreate, {
        documentType: DocumentType.CC,
        documentNumber: '123456789',
        email: 'test@example.com',
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)

      // Should have errors for both firstName and lastName
      const firstNameError = errors.find((e) => e.property === 'firstName')
      const lastNameError = errors.find((e) => e.property === 'lastName')
      expect(firstNameError || lastNameError).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should validate email with various formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
      ]

      for (const email of validEmails) {
        const dto = plainToClass(ContactCreate, {
          documentType: DocumentType.CC,
          documentNumber: '123456789',
          firstName: 'John',
          lastName: 'Doe',
          email,
        })

        const errors = await validate(dto)
        expect(errors).toHaveLength(0)
      }
    })

    it('should validate with all optional fields provided', async () => {
      const dto = plainToClass(ContactCreate, {
        documentType: DocumentType.CC,
        documentNumber: '123456789',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        address: '123 Main St',
        addressExtra: 'Apt 4B',
        cityCode: '110111',
      })

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should validate with minimal required fields', async () => {
      const dto = plainToClass(ContactCreate, {
        documentType: DocumentType.CC,
        documentNumber: '123456789',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      })

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })
})
