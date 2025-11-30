import 'reflect-metadata'
import { validate } from 'class-validator'
import { plainToClass } from 'class-transformer'
import { ContactUpdate } from './update-contact.dto'
import { DocumentType } from '../interfaces/contact.interface'

describe('ContactUpdate', () => {
  describe('Valid DTOs', () => {
    it('should validate an empty DTO', async () => {
      const dto = plainToClass(ContactUpdate, {})

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should validate partial updates with single field', async () => {
      const dto = plainToClass(ContactUpdate, {
        phone: '+9876543210',
      })

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should validate partial updates with multiple fields', async () => {
      const dto = plainToClass(ContactUpdate, {
        phone: '+9876543210',
        address: '456 Oak Ave',
        cityCode: '110112',
      })

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should validate updating to legal name', async () => {
      const dto = plainToClass(ContactUpdate, {
        legalName: 'New Company Name Inc',
      })

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should validate updating personal names', async () => {
      const dto = plainToClass(ContactUpdate, {
        firstName: 'Jane',
        lastName: 'Smith',
      })

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should validate updating document information', async () => {
      const dto = plainToClass(ContactUpdate, {
        documentType: DocumentType.CE,
        documentNumber: '987654321',
      })

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should validate updating email', async () => {
      const dto = plainToClass(ContactUpdate, {
        email: 'newemail@example.com',
      })

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })

  describe('Invalid DTOs', () => {
    it('should fail when email is invalid', async () => {
      const dto = plainToClass(ContactUpdate, {
        email: 'not-an-email',
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      const emailError = errors.find((e) => e.property === 'email')
      expect(emailError).toBeDefined()
    })

    it('should fail when documentType is invalid', async () => {
      const dto = plainToClass(ContactUpdate, {
        documentType: 'INVALID_TYPE' as DocumentType,
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      const docTypeError = errors.find((e) => e.property === 'documentType')
      expect(docTypeError).toBeDefined()
    })

    it('should fail when documentNumber is not a string', async () => {
      const dto = plainToClass(ContactUpdate, {
        documentNumber: 123456789 as any,
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      const docNumberError = errors.find((e) => e.property === 'documentNumber')
      expect(docNumberError).toBeDefined()
    })

    it('should fail when firstName is not a string', async () => {
      const dto = plainToClass(ContactUpdate, {
        firstName: 123 as any,
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      const firstNameError = errors.find((e) => e.property === 'firstName')
      expect(firstNameError).toBeDefined()
    })

    it('should fail when lastName is not a string', async () => {
      const dto = plainToClass(ContactUpdate, {
        lastName: 456 as any,
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      const lastNameError = errors.find((e) => e.property === 'lastName')
      expect(lastNameError).toBeDefined()
    })

    it('should fail when phone is not a string', async () => {
      const dto = plainToClass(ContactUpdate, {
        phone: 1234567890 as any,
      })

      const errors = await validate(dto)
      expect(errors.length).toBeGreaterThan(0)
      const phoneError = errors.find((e) => e.property === 'phone')
      expect(phoneError).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should validate with all fields updated', async () => {
      const dto = plainToClass(ContactUpdate, {
        documentType: DocumentType.CC,
        documentNumber: '999888777',
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        phone: '+1111111111',
        address: '999 New St',
        addressExtra: 'Suite 100',
        cityCode: '999999',
      })

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })

    it('should inherit validation from CreateContactDto', async () => {
      // ContactUpdate extends PartialType(CreateContactDto)
      // So it should inherit all validations but make them optional
      const dto = plainToClass(ContactUpdate, {
        email: 'valid@email.com',
      })

      const errors = await validate(dto)
      expect(errors).toHaveLength(0)
    })
  })
})
