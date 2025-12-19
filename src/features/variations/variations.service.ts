import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Variation } from './schemas/variation.schema'
import {
  CreateVariationDto,
  UpdateVariationDto,
} from './dto/create-variation.dto'
import { randomUUID } from 'crypto'

@Injectable()
export class VariationsService {
  constructor(
    @InjectModel(Variation.name) private variationModel: Model<Variation>,
  ) {}

  /**
   * Creates a new variation.
   * @param createVariationDto - Data to create the variation.
   * @returns The created variation.
   */
  async create(createVariationDto: CreateVariationDto): Promise<Variation> {
    const variation = new this.variationModel({
      ...createVariationDto,
      _id: randomUUID(),
    })
    return variation.save()
  }

  /**
   * Retrieves all variations.
   * @returns List of all variations.
   */
  async findAll(): Promise<Variation[]> {
    return this.variationModel.find().exec()
  }

  /**
   * Retrieves a single variation by ID.
   * @param id - Variation ID.
   * @returns The found variation.
   * @throws NotFoundException if variation is not found.
   */
  async findOne(id: string): Promise<Variation> {
    const variation = await this.variationModel.findById(id).exec()
    if (!variation) {
      throw new NotFoundException(`Variation with ID ${id} not found`)
    }
    return variation
  }

  /**
   * Updates a variation.
   * @param id - Variation ID.
   * @param updateVariationDto - Data to update.
   * @returns The updated variation.
   * @throws NotFoundException if variation is not found.
   */
  async update(
    id: string,
    updateVariationDto: UpdateVariationDto,
  ): Promise<Variation> {
    const variation = await this.variationModel
      .findByIdAndUpdate(id, { $set: updateVariationDto }, { new: true })
      .exec()
    if (!variation) {
      throw new NotFoundException(`Variation with ID ${id} not found`)
    }
    return variation
  }

  /**
   * Deletes a variation.
   * @param id - Variation ID.
   * @throws NotFoundException if variation is not found.
   */
  async remove(id: string): Promise<void> {
    const result = await this.variationModel.findByIdAndDelete(id).exec()
    if (!result) {
      throw new NotFoundException(`Variation with ID ${id} not found`)
    }
  }
}
