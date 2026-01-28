/* eslint-disable @typescript-eslint/unbound-method, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { of, throwError } from 'rxjs'
import { ContactsController } from './contacts.controller'
import { ContactService } from '../services/contact.service'
import { ContactCreate } from '../dtos/create-contact.dto'
import { ContactUpdate } from '../dtos/update-contact.dto'
import { ContactDocument, DocumentType } from '../interfaces/contact.interface'
import { Types } from 'mongoose'
import { AuthGuard } from '@nestjs/passport'
import { PermissionsGuard } from '../../../auth/permissions.guard'

describe('ContactsController', () => {
  let controller: ContactsController
  let service: ContactService

  const mockContactDocument = {
    _id: new Types.ObjectId(),
    documentType: DocumentType.CC,
    documentNumber: '123456789',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    addressExtra: 'Apt 4B',
    cityCode: '110111',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    isDeleted: false,
    softDelete: jest.fn(),
    restore: jest.fn(),
  } as unknown as ContactDocument

  const mockContactService = {
    createContact: jest.fn(),
    findAllPaginated: jest.fn(),
    findByDocument: jest.fn(), // Keep for service mock consistency if needed
    updateContact: jest.fn(),
    findById: jest.fn(),
    softDelete: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        {
          provide: ContactService,
          useValue: mockContactService,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<ContactsController>(ContactsController)
    service = module.get<ContactService>(ContactService)

    // Reset all mocks
    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  describe('create', () => {
    it('should create a contact successfully', (done) => {
      const createDto: ContactCreate = {
        documentType: DocumentType.CC,
        documentNumber: '123456789',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      }

      mockContactService.createContact.mockReturnValue(of(mockContactDocument))

      controller.create(createDto).subscribe({
        next: (result) => {
          expect(result).toEqual(mockContactDocument)
          expect(service.createContact).toHaveBeenCalledWith(createDto)
          done()
        },
        error: done.fail,
      })
    })

    it('should propagate errors from service', (done) => {
      const createDto: ContactCreate = {
        documentType: DocumentType.CC,
        documentNumber: '123456789',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      }

      const error = new Error('Database error')
      mockContactService.createContact.mockReturnValue(throwError(() => error))

      controller.create(createDto).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err) => {
          expect(err).toEqual(error)
          done()
        },
      })
    })
  })

  describe('findAll', () => {
    it('should return paginated contacts', (done) => {
      const mockResult = {
        data: [mockContactDocument],
        total: 1,
        page: 1,
        limit: 10,
      }
      mockContactService.findAllPaginated.mockReturnValue(of(mockResult))

      controller
        .findAll(1, 10, undefined, undefined, undefined, {
          email: 'test@example.com',
        })
        .subscribe({
          next: (result) => {
            try {
              expect(result).toEqual(mockResult)
              expect(mockContactService.findAllPaginated).toHaveBeenCalledWith(
                { email: 'test@example.com' },
                1,
                10,
                undefined,
                { createdAt: -1 },
                [],
              )
              done()
            } catch (err) {
              done.fail(err)
            }
          },
          error: (err) => done.fail(err),
        })
    })
  })
  // Removed findByDocument tests as the endpoint was removed

  describe('findOne', () => {
    it('should return a contact by id', (done) => {
      const id = mockContactDocument._id.toString()

      mockContactService.findById.mockReturnValue(of(mockContactDocument))

      controller.findOne(id).subscribe({
        next: (result) => {
          expect(result).toEqual(mockContactDocument)
          expect(service.findById).toHaveBeenCalledWith(id)
          done()
        },
        error: done.fail,
      })
    })

    it('should throw NotFoundException when contact not found', (done) => {
      const id = new Types.ObjectId().toString()

      mockContactService.findById.mockReturnValue(of(null))

      controller.findOne(id).subscribe({
        next: () => done.fail('Should have thrown NotFoundException'),
        error: (err) => {
          expect(err).toBeInstanceOf(NotFoundException)
          expect(err.message).toBe(`Contact with ID ${id} not found`)
          done()
        },
      })
    })
  })

  describe('update', () => {
    it('should update a contact successfully', (done) => {
      const id = mockContactDocument._id.toString()
      const updateDto: ContactUpdate = {
        phone: '+9876543210',
        address: '456 Oak Ave',
      }

      const updatedContact = { ...mockContactDocument, ...updateDto }
      mockContactService.updateContact.mockReturnValue(of(updatedContact))

      controller.update(id, updateDto).subscribe({
        next: (result) => {
          expect(result).toEqual(updatedContact)
          expect(service.updateContact).toHaveBeenCalledWith(id, updateDto)
          done()
        },
        error: done.fail,
      })
    })

    it('should throw NotFoundException when contact not found', (done) => {
      const id = new Types.ObjectId().toString()
      const updateDto: ContactUpdate = {
        phone: '+9876543210',
      }

      mockContactService.updateContact.mockReturnValue(of(null))

      controller.update(id, updateDto).subscribe({
        next: () => done.fail('Should have thrown NotFoundException'),
        error: (err) => {
          expect(err).toBeInstanceOf(NotFoundException)
          expect(err.message).toBe(`Contact with ID ${id} not found`)
          done()
        },
      })
    })

    it('should propagate validation errors from service', (done) => {
      const id = mockContactDocument._id.toString()
      const updateDto: ContactUpdate = {
        legalName: 'Company Inc',
        firstName: 'John',
      }

      const error = new Error('Cannot have both legalName and personal names')
      mockContactService.updateContact.mockReturnValue(throwError(() => error))

      controller.update(id, updateDto).subscribe({
        next: () => done.fail('Should have thrown an error'),
        error: (err) => {
          expect(err).toEqual(error)
          done()
        },
      })
    })
  })

  describe('remove', () => {
    it('should soft delete a contact successfully', (done) => {
      const id = mockContactDocument._id.toString()
      const deletedContact = { ...mockContactDocument, isDeleted: true }

      mockContactService.softDelete.mockReturnValue(of(deletedContact))

      controller.remove(id).subscribe({
        next: (result) => {
          expect(result).toEqual(deletedContact)
          expect(service.softDelete).toHaveBeenCalledWith(id)
          done()
        },
        error: done.fail,
      })
    })

    it('should return null when contact not found', (done) => {
      const id = new Types.ObjectId().toString()

      mockContactService.softDelete.mockReturnValue(of(null))

      controller.remove(id).subscribe({
        next: (result) => {
          expect(result).toBeNull()
          done()
        },
        error: done.fail,
      })
    })
  })
})
