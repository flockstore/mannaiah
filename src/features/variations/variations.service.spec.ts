import { Test, TestingModule } from '@nestjs/testing'
import { VariationsService } from './variations.service'
import { VariationsRepository } from './variations.repository'
import { VariationDefinition } from './schemas/variation.schema'
import { NotFoundException } from '@nestjs/common'
import { of } from 'rxjs'

describe('VariationsService', () => {
  let service: VariationsService

  const mockVariationsRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VariationsService,
        {
          provide: VariationsRepository,
          useValue: mockVariationsRepository,
        },
      ],
    }).compile()

    service = module.get<VariationsService>(VariationsService)

    jest.clearAllMocks()
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('create', () => {
    it('should create a variation', async () => {
      const dto = {
        name: 'Color',
        definition: VariationDefinition.COLOR,
        value: '#000000',
      }
      const createdVariation = { ...dto, _id: 'uuid' }
      mockVariationsRepository.create.mockReturnValue(of(createdVariation))

      const result = await service.create(dto)
      expect(result).toEqual(createdVariation)
    })
  })

  describe('findAll', () => {
    it('should return array of variations', async () => {
      const variations = [{ name: 'v1' }, { name: 'v2' }]
      mockVariationsRepository.findAll.mockReturnValue(of(variations))

      const result = await service.findAll()
      expect(result).toEqual(variations)
    })
  })

  describe('findOne', () => {
    it('should return variation if found', async () => {
      const variation = { _id: 'uuid', name: 'v1' }
      mockVariationsRepository.findById.mockReturnValue(of(variation))

      const result = await service.findOne('uuid')
      expect(result).toEqual(variation)
    })

    it('should throw NotFoundException if not found', async () => {
      mockVariationsRepository.findById.mockReturnValue(of(null))
      await expect(service.findOne('uuid')).rejects.toThrow(NotFoundException)
    })
  })

  describe('update', () => {
    it('should update and return variation', async () => {
      const dto = { name: 'New Name' }
      const updatedVariation = { _id: 'uuid', name: 'New Name' }
      mockVariationsRepository.update.mockReturnValue(of(updatedVariation))

      const result = await service.update('uuid', dto)
      expect(mockVariationsRepository.update).toHaveBeenCalledWith('uuid', dto)
      expect(result).toEqual(updatedVariation)
    })

    it('should ignore definition update', async () => {
      const dto = { name: 'New Name', definition: 'COLOR' } as any
      const updatedVariation = { _id: 'uuid', name: 'New Name', definition: 'SIZE' } // Keeps old def
      mockVariationsRepository.update.mockReturnValue(of(updatedVariation))

      await service.update('uuid', dto)

      // Expect definition to be removed from the call
      expect(mockVariationsRepository.update).toHaveBeenCalledWith('uuid', {
        name: 'New Name',
      })
    })

    it('should throw NotFoundException if update target not found', async () => {
      mockVariationsRepository.update.mockReturnValue(of(null))
      await expect(service.update('uuid', { name: 'test' })).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  describe('remove', () => {
    it('should delete variation', async () => {
      const deletedVariation = { _id: 'uuid' }
      mockVariationsRepository.softDelete.mockReturnValue(of(deletedVariation))

      await service.remove('uuid')
      expect(mockVariationsRepository.softDelete).toHaveBeenCalledWith('uuid')
    })

    it('should throw NotFoundException if delete target not found', async () => {
      mockVariationsRepository.softDelete.mockReturnValue(of(null))
      await expect(service.remove('uuid')).rejects.toThrow(NotFoundException)
    })
  })
})
