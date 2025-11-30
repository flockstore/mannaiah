import { Test, TestingModule } from '@nestjs/testing'
import { ContactService } from './contact.service'
import { ContactRepository } from '../repositories/contact.repository'
import {
  InvalidNameCombinationError,
  MissingNameError,
} from '../errors/contact.errors'
import { BadRequestException } from '@nestjs/common'

const mockContactRepository = () => ({
  create: jest.fn(),
  findByDocument: jest.fn(),
  findByEmail: jest.fn(),
  update: jest.fn(),
  findById: jest.fn(),
})

describe('ContactService', () => {
  let service: ContactService

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
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
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
