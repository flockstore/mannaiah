import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { BaseRepository } from '../../core/mongo/repositories/base.repository'
import { Product, ProductDocument } from './schemas/product.schema'

/**
 * Repository for Product documents.
 * Extends BaseRepository to provide standard CRUD operations.
 */
@Injectable()
export class ProductsRepository extends BaseRepository<ProductDocument> {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {
    super(productModel)
  }
}
