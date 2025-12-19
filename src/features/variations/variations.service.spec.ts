import { Test, TestingModule } from '@nestjs/testing'
import { VariationsService } from './variations.service'
import { getModelToken } from '@nestjs/mongoose'
import { Variation, VariationDefinition } from './schemas/variation.schema'
// import { randomUUID } from 'crypto'

describe('VariationsService', () => {
  let service: VariationsService

  class MockVariationModel {
    save: any
    constructor(private data: any) {
      Object.assign(this, data)
      this.save = jest.fn().mockResolvedValue(this.data)
    }

    static find = jest.fn()
    static findById = jest.fn()
    static findByIdAndUpdate = jest.fn()
    static findByIdAndDelete = jest.fn()
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VariationsService,
        {
          provide: getModelToken(Variation.name),
          useValue: MockVariationModel,
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
      // Logic creates new instance

      const result = await service.create(dto)
      expect(result).toMatchObject(dto)
    })
  })

  describe('findAll', () => {
    it('should return array of variations', async () => {
      const variations = [{ name: 'v1' }, { name: 'v2' }]
      MockVariationModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(variations),
      })

      const result = await service.findAll()
      expect(result).toEqual(variations)
    })
  })

  describe('findOne', () => {
    it('should return variation if found', async () => {
      const variation = { _id: 'uuid', name: 'v1' }
      MockVariationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(variation),
      })

      const result = await service.findOne('uuid')
      expect(result).toEqual(variation)
    })

    it('should throw NotFoundException if not found', async () => {
      MockVariationModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })

      await expect(service.findOne('uuid')).rejects.toThrow(
        'Variation with ID uuid not found',
      )
    })
  })

  describe('update', () => {
    it('should update and return variation', async () => {
      const dto = { name: 'New Name' }
      const updatedVariation = { _id: 'uuid', name: 'New Name' }

      MockVariationModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedVariation),
      })

      const result = await service.update('uuid', dto)

      expect(MockVariationModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'uuid',
        { $set: dto },
        { new: true },
      )
      expect(result).toEqual(updatedVariation)
    })

    it('should throw NotFoundException if update target not found', async () => {
      MockVariationModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })

      await expect(service.update('uuid', { name: 'test' })).rejects.toThrow(
        'Variation with ID uuid not found',
      )
    })
  })

  describe('remove', () => {
    it('should delete variation', async () => {
      MockVariationModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      })

      await service.remove('uuid')
      expect(MockVariationModel.findByIdAndDelete).toHaveBeenCalledWith('uuid')
    })

    it('should throw NotFoundException if delete target not found', async () => {
      MockVariationModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })

      await expect(service.remove('uuid')).rejects.toThrow(
        'Variation with ID uuid not found',
      )
    })
  })
})
