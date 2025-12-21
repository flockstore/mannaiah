import { Injectable, NotFoundException } from '@nestjs/common'
import { lastValueFrom } from 'rxjs'
import { Variation } from './schemas/variation.schema'
import { VariationsRepository } from './variations.repository'
import {
  CreateVariationDto,
  UpdateVariationDto,
} from './dto/create-variation.dto'
import { randomUUID } from 'crypto'

@Injectable()
export class VariationsService {
  constructor(private readonly variationsRepository: VariationsRepository) {}

  /**
   * Creates a new variation.
   *
   * @param createVariationDto - Data to create the variation.
   * @returns The created variation.
   */
  async create(createVariationDto: CreateVariationDto): Promise<Variation> {
    return lastValueFrom(
      this.variationsRepository.create({
        ...createVariationDto,
        _id: randomUUID(),
      }),
    )
  }

  /**
   * Retrieves all variations.
   *
   * @returns List of all variations.
   */
  async findAll(): Promise<Variation[]> {
    return lastValueFrom(this.variationsRepository.findAll())
  }

  /**
   * Retrieves a single variation by ID.
   *
   * @param id - Variation ID.
   * @returns The found variation.
   * @throws NotFoundException if variation is not found.
   */
  async findOne(id: string): Promise<Variation> {
    const variation = await lastValueFrom(
      this.variationsRepository.findById(id),
    )
    if (!variation) {
      throw new NotFoundException(`Variation with ID ${id} not found`)
    }
    return variation
  }

  /**
   * Updates a variation.
   *
   * @param id - Variation ID.
   * @param updateVariationDto - Data to update.
   * @returns The updated variation.
   * @throws NotFoundException if variation is not found.
   */
  async update(
    id: string,
    updateVariationDto: UpdateVariationDto,
  ): Promise<Variation> {
    const variation = await lastValueFrom(
      this.variationsRepository.update(id, updateVariationDto),
    )
    if (!variation) {
      throw new NotFoundException(`Variation with ID ${id} not found`)
    }
    return variation
  }

  /**
   * Deletes a variation.
   *
   * @param id - Variation ID.
   * @throws NotFoundException if variation is not found.
   */
  async remove(id: string): Promise<void> {
    const result = await lastValueFrom(this.variationsRepository.softDelete(id))
    if (!result) {
      throw new NotFoundException(`Variation with ID ${id} not found`)
    }
  }
}
