import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ProductsService } from './products.service'
import { ProductsController } from './products.controller'
import { Product, ProductSchema } from './schemas/product.schema'
import { AssetsModule } from '../assets/assets.module'
import { VariationsModule } from '../variations/variations.module'
import { ProductsRepository } from './products.repository'

/**
 * Module for the Product feature.
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    AssetsModule,
    VariationsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
  exports: [ProductsService],
})
export class ProductsModule {}
