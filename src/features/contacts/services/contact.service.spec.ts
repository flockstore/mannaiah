import { Test, TestingModule } from '@nestjs/testing'
import { ContactService } from './contact.service'
import { ContactRepository } from '../repositories/contact.repository'
import {
  InvalidNameCombinationError,
  MissingNameError,
} from '../errors/contact.errors'
import { BadRequestException } from '@nestjs/common'
import { of } from 'rxjs'
import { DocumentType } from '../interfaces/contact.interface'

const mockContactRepository = () => ({
  create: jest.fn(),
  findByDocument: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
})

describe('ContactService', () => {
  let service: ContactService
  let repository: any

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        {
          provide: ContactRepository,
          useFactory: mockContactRepository,
        },
      ],
    }).compile()

    service = module.get<ContactService>(ContactService)
    repository = module.get(ContactRepository)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('createContact', () => {
    it('should sanitize phone number by removing spaces and +', (done) => {
      const createDto: any = {
        phone: '+1 234 567',
        legalName: 'Test Corp',
        email: 'test@example.com',
        documentType: DocumentType.NIT,
        documentNumber: '123',
      }

      const expectedDto = { ...createDto, phone: '1234567' }
      repository.create.mockReturnValue(of(expectedDto))

      service.createContact(createDto).subscribe(() => {
        expect(repository.create).toHaveBeenCalledWith(expectedDto)
        done()
      })
    })
  })

  describe('updateContact', () => {
    it('should sanitize phone number on update', (done) => {
      const updateDto: any = {
        phone: '+1 234 567',
      }
      const id = 'some-id'
      const expectedDto = { ...updateDto, phone: '1234567' }

      repository.update.mockReturnValue(of({}))

      service.updateContact(id, updateDto).subscribe(() => {
        expect(repository.update).toHaveBeenCalledWith(id, expectedDto)
        done()
      })
    })
  })

  describe('validateNames', () => {
    it('should throw InvalidNameCombinationError when both legalName and personal names are provided', () => {
      expect(() =>
        service.validateNames('Legal Name', 'First', 'Last'),
      ).toThrow(InvalidNameCombinationError)
      expect(() =>
        service.validateNames('Legal Name', 'First', 'Last'),
      ).toThrow(BadRequestException)
    })

    it('should throw MissingNameError when neither legalName nor full personal names are provided', () => {
      expect(() =>
        service.validateNames(undefined, undefined, undefined),
      ).toThrow(MissingNameError)
      expect(() =>
        service.validateNames(undefined, 'First', undefined),
      ).toThrow(MissingNameError)
      expect(() =>
        service.validateNames(undefined, undefined, undefined),
      ).toThrow(BadRequestException)
    })

    it('should not throw when only legalName is provided', () => {
      expect(() =>
        service.validateNames('Legal Name', undefined, undefined),
      ).not.toThrow()
    })

    it('should not throw when only full personal name is provided', () => {
      expect(() =>
        service.validateNames(undefined, 'First', 'Last'),
      ).not.toThrow()
    })
  })
})
