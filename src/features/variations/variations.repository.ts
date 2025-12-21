import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { BaseRepository } from '../../core/mongo/repositories/base.repository'
import { Variation, VariationDocument } from './schemas/variation.schema'

/**
 * Repository for Variation documents.
 * Extends BaseRepository to provide standard CRUD operations.
 */
@Injectable()
export class VariationsRepository extends BaseRepository<VariationDocument> {
  constructor(
    @InjectModel(Variation.name)
    private variationModel: Model<VariationDocument>,
  ) {
    super(variationModel)
  }
}
